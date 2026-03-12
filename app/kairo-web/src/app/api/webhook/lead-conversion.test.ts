/**
 * Tests for lead conversion tracking.
 *
 * When a Lead's email matches a newly-activated Member,
 * the lead.convertedAt should be set.
 *
 * This tests the webhook integration: when checkout.session.completed fires
 * and we activate a member, we also update the Lead record.
 *
 * Behavior matrix coverage:
 * - Happy path: lead exists → convertedAt set on member activation
 * - Boundary: no lead exists for this email → no error, member still activated
 * - Idempotency: already converted lead → convertedAt not overwritten
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  mockPrisma,
  mockStripeConstructEvent,
  mockNotifyAdmin,
  mockSendWelcomeEmail,
} from "@/test/setup";
import {
  makeCheckoutCompletedEvent,
  makeWebhookRequest,
} from "@/test/fixtures";
import { POST } from "@/app/api/webhook/route";

describe("Lead conversion tracking in webhook", () => {
  beforeEach(() => {
    mockPrisma.$transaction.mockReset();
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)
    );
    mockPrisma.stripeEvent.findUnique.mockResolvedValue(null);
    mockPrisma.stripeEvent.create.mockResolvedValue({ id: "evt_test" });
    mockPrisma.member.upsert.mockResolvedValue({ id: "m1", status: "active" });
    mockPrisma.lead.findUnique.mockReset();
    mockPrisma.lead.update.mockReset();
    mockNotifyAdmin.mockResolvedValue(undefined);
    mockSendWelcomeEmail.mockResolvedValue(undefined);
  });

  it("updates lead.convertedAt when lead exists for activated member email", async () => {
    const event = makeCheckoutCompletedEvent({ email: "lead@test.com" });
    mockStripeConstructEvent.mockReturnValue(event);
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: "lead_1",
      email: "lead@test.com",
      convertedAt: null,
    });
    mockPrisma.lead.update.mockResolvedValue({
      id: "lead_1",
      convertedAt: new Date(),
    });

    await POST(makeWebhookRequest(JSON.stringify(event)));

    expect(mockPrisma.lead.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "lead@test.com" },
        data: expect.objectContaining({
          convertedAt: expect.any(Date),
        }),
      })
    );
  });

  it("does not error when no lead exists for the email", async () => {
    const event = makeCheckoutCompletedEvent({ email: "no-lead@test.com" });
    mockStripeConstructEvent.mockReturnValue(event);
    mockPrisma.lead.findUnique.mockResolvedValue(null);

    const res = await POST(makeWebhookRequest(JSON.stringify(event)));

    // Webhook should still succeed (member activated)
    expect(res.status).toBe(200);
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it("does not overwrite convertedAt if already set", async () => {
    const existingDate = new Date("2026-03-01");
    const event = makeCheckoutCompletedEvent({ email: "already@test.com" });
    mockStripeConstructEvent.mockReturnValue(event);
    mockPrisma.lead.findUnique.mockResolvedValue({
      id: "lead_2",
      email: "already@test.com",
      convertedAt: existingDate,
    });

    await POST(makeWebhookRequest(JSON.stringify(event)));

    // Should NOT update since convertedAt is already set
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });
});
