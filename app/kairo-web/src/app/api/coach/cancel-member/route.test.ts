/**
 * Tests for POST /api/coach/cancel-member
 *
 * Coach-initiated cancellation via Bearer COACH_SECRET.
 * Covers: no auth, invalid secret, validation, not found,
 * already canceled, db-only, Stripe cancel, errors.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  mockPrisma,
  mockStripeSubscriptionsUpdate,
} from "@/test/setup";

const { POST } = await import("./route");

const COACH_SECRET = "test-coach-secret-1234567890";
const TEST_EMAIL = "member@test.com";

function makeCoachRequest(
  body: Record<string, unknown>,
  secret?: string | null
): Request {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== null) {
    headers["authorization"] = `Bearer ${secret ?? COACH_SECRET}`;
  }
  return new Request("http://localhost:3000/api/coach/cancel-member", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/coach/cancel-member", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
    mockStripeSubscriptionsUpdate.mockReset();
    mockStripeSubscriptionsUpdate.mockResolvedValue({});
  });

  // ── Auth ──

  it("returns 401 without Authorization header", async () => {
    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }, null) as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 with wrong secret", async () => {
    const res = await POST(
      makeCoachRequest({ email: TEST_EMAIL }, "wrong-secret") as never
    );
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  // ── Validation ──

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeCoachRequest({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(makeCoachRequest({ email: "not-valid" }) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when body is not valid JSON", async () => {
    const req = new Request("http://localhost:3000/api/coach/cancel-member", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${COACH_SECRET}`,
      },
      body: "not json",
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  // ── Not found ──

  it("returns 404 when member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }) as never);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  // ── Already canceled ──

  it("returns 409 when member is already canceled", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_test_123",
      status: "canceled",
    });

    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }) as never);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_CANCELED");
  });

  // ── No Stripe subscription (db-only cancel) ──

  it("cancels via DB when member has no Stripe subscription", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: null,
      status: "active",
    });
    mockPrisma.member.update.mockResolvedValue({});

    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("db_only");

    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { email: TEST_EMAIL },
      data: { status: "canceled" },
    });
    expect(mockStripeSubscriptionsUpdate).not.toHaveBeenCalled();
  });

  // ── Stripe cancel at period end ──

  it("cancels Stripe subscription at period end", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_test_456",
      status: "active",
    });

    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }) as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("stripe_cancel_at_period_end");

    expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith("sub_test_456", {
      cancel_at_period_end: true,
    });
  });

  // ── Error handling ──

  it("returns 500 on Stripe API error", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_test_789",
      status: "active",
    });
    mockStripeSubscriptionsUpdate.mockRejectedValue(
      new Error("Stripe unavailable")
    );

    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }) as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CANCEL_ERROR");
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findUnique.mockRejectedValue(new Error("DB down"));

    const res = await POST(makeCoachRequest({ email: TEST_EMAIL }) as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CANCEL_ERROR");
  });
});
