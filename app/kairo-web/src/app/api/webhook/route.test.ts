/**
 * Tests for POST /api/webhook
 *
 * Coverage: signature verification, idempotency, member upsert,
 * admin notification, unknown events, missing fields, security.
 * All external calls mocked — no real Stripe/DB/email.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockPrisma,
  mockStripeConstructEvent,
  mockNotifyAdmin,
  mockNotifyAdminCancellation,
  mockSendWelcomeEmail,
} from "@/test/setup";
import {
  makeCheckoutCompletedEvent,
  makeUnknownEvent,
  makeSubscriptionDeletedEvent,
  makeInvoicePaymentFailedEvent,
  makeInvoicePaymentSucceededEvent,
} from "@/test/fixtures";
import { POST } from "@/app/api/webhook/route";

function makeRequest(
  body = "raw_webhook_body",
  signature: string | null = "sig_test_valid"
): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (signature) {
    headers.set("stripe-signature", signature);
  }
  return new NextRequest("http://localhost:3000/api/webhook", {
    method: "POST",
    headers,
    body,
  });
}

describe("POST /api/webhook", () => {
  beforeEach(() => {
    mockStripeConstructEvent.mockReset();
    mockPrisma.stripeEvent.findUnique.mockReset();
    mockPrisma.stripeEvent.create.mockReset();
    mockPrisma.member.upsert.mockReset();
    mockPrisma.member.updateMany.mockReset();
    mockNotifyAdmin.mockReset();
    mockNotifyAdminCancellation.mockReset();
    mockSendWelcomeEmail.mockReset();
    // Default: email functions succeed (fire-and-forget)
    mockNotifyAdmin.mockResolvedValue(undefined);
    mockNotifyAdminCancellation.mockResolvedValue(undefined);
    mockSendWelcomeEmail.mockResolvedValue(undefined);
  });

  // ── Signature Verification ──

  describe("signature verification", () => {
    it("returns 400 when stripe-signature header is missing", async () => {
      const response = await POST(makeRequest("body", null));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("WEBHOOK_ERROR");
      expect(data.error.message).toContain("stripe-signature");
    });

    it("returns 400 when signature is invalid", async () => {
      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error("No signatures found matching the expected signature");
      });

      const response = await POST(makeRequest("body", "sig_bad"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("WEBHOOK_SIGNATURE_ERROR");
    });

    it("passes raw body and signature to constructEvent", async () => {
      const event = makeCheckoutCompletedEvent();
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});

      await POST(makeRequest("raw_body_content", "sig_123"));

      expect(mockStripeConstructEvent).toHaveBeenCalledWith(
        "raw_body_content",
        "sig_123",
        "whsec_test_fake"
      );
    });
  });

  // ── Idempotency ──

  describe("idempotency", () => {
    it("skips already-processed events", async () => {
      const event = makeCheckoutCompletedEvent({ eventId: "evt_duplicate" });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue({
        id: "evt_duplicate",
        createdAt: new Date(),
      });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("already_processed");
      expect(mockPrisma.member.upsert).not.toHaveBeenCalled();
      expect(mockNotifyAdmin).not.toHaveBeenCalled();
    });

    it("stores event ID before processing", async () => {
      const event = makeCheckoutCompletedEvent({ eventId: "evt_new_123" });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});

      await POST(makeRequest());

      expect(mockPrisma.stripeEvent.create).toHaveBeenCalledWith({
        data: { id: "evt_new_123" },
      });
    });

    it("records event before upserting member", async () => {
      const callOrder: string[] = [];
      const event = makeCheckoutCompletedEvent();
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockImplementation(async () => {
        callOrder.push("createEvent");
        return { id: event.id };
      });
      mockPrisma.member.upsert.mockImplementation(async () => {
        callOrder.push("upsertMember");
        return {};
      });

      await POST(makeRequest());

      expect(callOrder).toEqual(["createEvent", "upsertMember"]);
    });
  });

  // ── checkout.session.completed — Happy Path ──

  describe("checkout.session.completed", () => {
    it("upserts member with correct data", async () => {
      const event = makeCheckoutCompletedEvent({
        email: "new@member.com",
        customerId: "cus_happy",
        subscriptionId: "sub_happy",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
      expect(mockPrisma.member.upsert).toHaveBeenCalledWith({
        where: { email: "new@member.com" },
        create: {
          email: "new@member.com",
          stripeCustomerId: "cus_happy",
          stripeSubId: "sub_happy",
          status: "active",
          planTier: "foundation",
          billingInterval: "monthly",
        },
        update: {
          stripeCustomerId: "cus_happy",
          stripeSubId: "sub_happy",
          status: "active",
          planTier: "foundation",
          billingInterval: "monthly",
        },
      });
    });

    it("sends admin notification with member details", async () => {
      const event = makeCheckoutCompletedEvent({
        email: "notify@test.com",
        customerId: "cus_notify",
        subscriptionId: "sub_notify",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});

      await POST(makeRequest());

      expect(mockNotifyAdmin).toHaveBeenCalledWith({
        memberEmail: "notify@test.com",
        stripeCustomerId: "cus_notify",
        stripeSubId: "sub_notify",
      });
    });

    it("still returns 200 if admin notification fails", async () => {
      const event = makeCheckoutCompletedEvent();
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});
      mockNotifyAdmin.mockRejectedValue(new Error("Email service down"));

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
    });

    it("sends welcome email to the new member", async () => {
      const event = makeCheckoutCompletedEvent({
        email: "welcome@test.com",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});

      await POST(makeRequest());

      expect(mockSendWelcomeEmail).toHaveBeenCalledWith({
        memberEmail: "welcome@test.com",
      });
    });

    it("still returns 200 if welcome email fails", async () => {
      const event = makeCheckoutCompletedEvent();
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.upsert.mockResolvedValue({});
      mockSendWelcomeEmail.mockRejectedValue(new Error("Welcome email failed"));

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
    });
  });

  // ── Missing Fields ──

  describe("missing fields", () => {
    it("returns 400 when email is missing", async () => {
      const event = makeCheckoutCompletedEvent({ email: null });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("WEBHOOK_ERROR");
      expect(mockPrisma.member.upsert).not.toHaveBeenCalled();
    });

    it("returns 400 when customerId is missing", async () => {
      const event = makeCheckoutCompletedEvent({ customerId: null });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("WEBHOOK_ERROR");
    });

    it("returns 400 when subscriptionId is missing", async () => {
      const event = makeCheckoutCompletedEvent({ subscriptionId: null });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("WEBHOOK_ERROR");
    });
  });

  // ── Unknown Events ──

  describe("unknown events", () => {
    it("returns 200 with status 'ignored' for unhandled event types", async () => {
      const event = makeUnknownEvent("invoice.created");
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ignored");
      expect(mockPrisma.member.upsert).not.toHaveBeenCalled();
    });

    it("does not create StripeEvent record for unknown events", async () => {
      const event = makeUnknownEvent("invoice.created");
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      await POST(makeRequest());

      expect(mockPrisma.stripeEvent.create).not.toHaveBeenCalled();
    });
  });

  // ── customer.subscription.deleted — Cancellation ──

  describe("customer.subscription.deleted", () => {
    it("marks member as canceled when subscription is deleted", async () => {
      const event = makeSubscriptionDeletedEvent({
        subscriptionId: "sub_to_cancel",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.updateMany.mockResolvedValue({ count: 1 });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
      expect(mockPrisma.member.updateMany).toHaveBeenCalledWith({
        where: { stripeSubId: "sub_to_cancel" },
        data: { status: "canceled" },
      });
    });

    it("records event for idempotency before updating member", async () => {
      const callOrder: string[] = [];
      const event = makeSubscriptionDeletedEvent({
        eventId: "evt_cancel_order",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockImplementation(async () => {
        callOrder.push("createEvent");
        return { id: event.id };
      });
      mockPrisma.member.updateMany.mockImplementation(async () => {
        callOrder.push("updateMember");
        return { count: 1 };
      });

      await POST(makeRequest());

      expect(callOrder).toEqual(["createEvent", "updateMember"]);
    });

    it("handles subscription with no matching member gracefully", async () => {
      const event = makeSubscriptionDeletedEvent({
        subscriptionId: "sub_nonexistent",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.updateMany.mockResolvedValue({ count: 0 });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
    });

    it("sends admin cancellation notification", async () => {
      const event = makeSubscriptionDeletedEvent({
        subscriptionId: "sub_cancel_notify",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.updateMany.mockResolvedValue({ count: 1 });

      await POST(makeRequest());

      expect(mockNotifyAdminCancellation).toHaveBeenCalledWith({
        stripeSubId: "sub_cancel_notify",
      });
    });

    it("still returns 200 if cancellation notification fails", async () => {
      const event = makeSubscriptionDeletedEvent({
        subscriptionId: "sub_cancel_fail",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.updateMany.mockResolvedValue({ count: 1 });
      mockNotifyAdminCancellation.mockRejectedValue(
        new Error("Cancellation email failed")
      );

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
    });
  });

  // ── Security ──

  describe("security", () => {
    it("never exposes webhook secret in error response", async () => {
      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error("whsec_test_fake is invalid");
      });

      const response = await POST(makeRequest());
      const text = await response.text();

      expect(text).not.toContain("whsec_");
    });

    it("returns structured error format on all failures", async () => {
      mockStripeConstructEvent.mockImplementation(() => {
        throw new Error("boom");
      });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
    });
  });

  // ── invoice.payment_failed — mark member past_due ──

  describe("invoice.payment_failed", () => {
    it("marks member as past_due when payment fails", async () => {
      const event = makeInvoicePaymentFailedEvent({
        subscriptionId: "sub_past_due_1",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.updateMany.mockResolvedValue({ count: 1 });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
      expect(mockPrisma.member.updateMany).toHaveBeenCalledWith({
        where: { stripeSubId: "sub_past_due_1" },
        data: { status: "past_due" },
      });
    });

    it("stores event ID for idempotency before updating member", async () => {
      const callOrder: string[] = [];
      const event = makeInvoicePaymentFailedEvent({
        eventId: "evt_fail_order",
        subscriptionId: "sub_order_test",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockImplementation(async () => {
        callOrder.push("createEvent");
        return { id: event.id };
      });
      mockPrisma.member.updateMany.mockImplementation(async () => {
        callOrder.push("updateMember");
        return { count: 1 };
      });

      await POST(makeRequest());

      expect(callOrder).toEqual(["createEvent", "updateMember"]);
    });

    it("returns 200 without updating when invoice has no subscription", async () => {
      const event = makeInvoicePaymentFailedEvent({ subscriptionId: null });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
      expect(mockPrisma.member.updateMany).not.toHaveBeenCalled();
    });

    it("skips already-processed invoice.payment_failed events", async () => {
      const event = makeInvoicePaymentFailedEvent({
        eventId: "evt_fail_dup",
        subscriptionId: "sub_dup",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue({
        id: "evt_fail_dup",
        createdAt: new Date(),
      });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("already_processed");
      expect(mockPrisma.member.updateMany).not.toHaveBeenCalled();
    });
  });

  // ── invoice.payment_succeeded — restore active status ──

  describe("invoice.payment_succeeded", () => {
    it("restores member to active when payment recovers", async () => {
      const event = makeInvoicePaymentSucceededEvent({
        subscriptionId: "sub_recovered_1",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockResolvedValue({ id: event.id });
      mockPrisma.member.updateMany.mockResolvedValue({ count: 1 });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
      expect(mockPrisma.member.updateMany).toHaveBeenCalledWith({
        where: { stripeSubId: "sub_recovered_1", status: "past_due" },
        data: { status: "active" },
      });
    });

    it("stores event ID for idempotency before updating member", async () => {
      const callOrder: string[] = [];
      const event = makeInvoicePaymentSucceededEvent({
        eventId: "evt_paid_order",
        subscriptionId: "sub_paid_order",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
      mockPrisma.stripeEvent.create.mockImplementation(async () => {
        callOrder.push("createEvent");
        return { id: event.id };
      });
      mockPrisma.member.updateMany.mockImplementation(async () => {
        callOrder.push("updateMember");
        return { count: 1 };
      });

      await POST(makeRequest());

      expect(callOrder).toEqual(["createEvent", "updateMember"]);
    });

    it("returns 200 without updating when invoice has no subscription", async () => {
      const event = makeInvoicePaymentSucceededEvent({ subscriptionId: null });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("processed");
      expect(mockPrisma.member.updateMany).not.toHaveBeenCalled();
    });

    it("skips already-processed invoice.payment_succeeded events", async () => {
      const event = makeInvoicePaymentSucceededEvent({
        eventId: "evt_paid_dup",
        subscriptionId: "sub_dup_paid",
      });
      mockStripeConstructEvent.mockReturnValue(event);
      mockPrisma.stripeEvent.findUnique.mockResolvedValue({
        id: "evt_paid_dup",
        createdAt: new Date(),
      });

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("already_processed");
      expect(mockPrisma.member.updateMany).not.toHaveBeenCalled();
    });
  });
});
