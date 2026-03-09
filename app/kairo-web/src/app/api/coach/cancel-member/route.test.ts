/**
 * Tests for POST /api/coach/cancel-member
 *
 * Coverage: auth guard, validation, member-not-found, already-canceled,
 * no-stripe-sub (DB-only cancel), Stripe cancel-at-period-end, error handling.
 * All Stripe/Prisma calls mocked.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";

const COACH_SECRET = "test-coach-secret-1234567890";

// ── Stripe subscriptions mock — use vi.hoisted to avoid initialization order issues ──
const { mockStripeSubscriptionsUpdate } = vi.hoisted(() => ({
  mockStripeSubscriptionsUpdate: vi.fn(),
}));

vi.mock("@/services/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      update: mockStripeSubscriptionsUpdate,
    },
  },
}));

import { POST } from "@/app/api/coach/cancel-member/route";

function makeRequest(body: Record<string, unknown> = {}, secret?: string): NextRequest {
  const url = secret
    ? `http://localhost:3000/api/coach/cancel-member?secret=${encodeURIComponent(secret)}`
    : "http://localhost:3000/api/coach/cancel-member";
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/coach/cancel-member", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
    mockStripeSubscriptionsUpdate.mockReset();
  });

  // ── Auth ──

  describe("auth", () => {
    it("returns 401 when secret is missing", async () => {
      const res = await POST(makeRequest({ email: "member@test.com" }));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when secret is wrong", async () => {
      const res = await POST(makeRequest({ email: "member@test.com" }, "wrong-secret"));
      expect(res.status).toBe(401);
    });

    it("does not call DB when unauthorized", async () => {
      await POST(makeRequest({ email: "member@test.com" }));
      expect(mockPrisma.member.findUnique).not.toHaveBeenCalled();
    });
  });

  // ── Validation ──

  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({}, COACH_SECRET));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const res = await POST(makeRequest({ email: "not-an-email" }, COACH_SECRET));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── Member not found ──

  it("returns 404 when member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ email: "nobody@test.com" }, COACH_SECRET));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe("NOT_FOUND");
  });

  // ── Already canceled ──

  it("returns 409 when member is already canceled", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_123",
      status: "canceled",
    });

    const res = await POST(makeRequest({ email: "canceled@test.com" }, COACH_SECRET));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe("ALREADY_CANCELED");
  });

  // ── DB-only cancel (no Stripe subscription) ──

  it("marks member canceled in DB when no stripeSubId", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: null,
      status: "active",
    });
    mockPrisma.member.update.mockResolvedValue({ status: "canceled" });

    const res = await POST(makeRequest({ email: "nosub@test.com" }, COACH_SECRET));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.method).toBe("db_only");

    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { email: "nosub@test.com" },
      data: { status: "canceled" },
    });
    expect(mockStripeSubscriptionsUpdate).not.toHaveBeenCalled();
  });

  // ── Stripe cancel at period end ──

  it("calls Stripe to cancel subscription at period end", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_active_123",
      status: "active",
    });
    mockStripeSubscriptionsUpdate.mockResolvedValue({
      id: "sub_active_123",
      cancel_at_period_end: true,
    });

    const res = await POST(makeRequest({ email: "active@test.com" }, COACH_SECRET));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.method).toBe("stripe_cancel_at_period_end");

    expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith("sub_active_123", {
      cancel_at_period_end: true,
    });
  });

  it("does not update member DB status directly on Stripe cancel (webhook does this)", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_active_456",
      status: "active",
    });
    mockStripeSubscriptionsUpdate.mockResolvedValue({});

    await POST(makeRequest({ email: "stripe@test.com" }, COACH_SECRET));

    expect(mockPrisma.member.update).not.toHaveBeenCalled();
  });

  // ── Error handling ──

  it("returns 500 when Stripe throws", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_err",
      status: "active",
    });
    mockStripeSubscriptionsUpdate.mockRejectedValue(new Error("Stripe down"));

    const res = await POST(makeRequest({ email: "err@test.com" }, COACH_SECRET));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe("CANCEL_ERROR");
  });

  it("never exposes Stripe error details in response", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_leak",
      status: "active",
    });
    mockStripeSubscriptionsUpdate.mockRejectedValue(
      new Error("sk_live_secretkey is invalid")
    );

    const res = await POST(makeRequest({ email: "leak@test.com" }, COACH_SECRET));
    const text = await res.text();

    expect(text).not.toContain("sk_live");
    expect(text).not.toContain("secretkey");
  });
});
