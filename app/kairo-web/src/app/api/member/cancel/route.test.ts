/**
 * Tests for POST /api/member/cancel
 *
 * Self-service cancellation: authenticated member cancels their own subscription.
 * Covers: no session, expired session, member not found, already canceled,
 * no Stripe sub (db-only cancel), Stripe cancel at period end, errors.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  mockPrisma,
  mockStripeSubscriptionsUpdate,
} from "@/test/setup";
import { createSessionToken } from "@/lib/auth";

const { POST } = await import("./route");

const TEST_EMAIL = "member@test.com";

async function makeAuthenticatedRequest(email?: string): Promise<Request> {
  const token = await createSessionToken(email ?? TEST_EMAIL);
  return new Request("http://localhost:3000/api/member/cancel", {
    method: "POST",
    headers: {
      cookie: `kairo_session=${token}`,
    },
  });
}

function makeUnauthenticatedRequest(): Request {
  return new Request("http://localhost:3000/api/member/cancel", {
    method: "POST",
  });
}

describe("POST /api/member/cancel", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
    mockStripeSubscriptionsUpdate.mockReset();
    mockStripeSubscriptionsUpdate.mockResolvedValue({});
  });

  // ── Auth ──

  it("returns 401 when no session cookie is present", async () => {
    const res = await POST(makeUnauthenticatedRequest() as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when session token is invalid", async () => {
    const req = new Request("http://localhost:3000/api/member/cancel", {
      method: "POST",
      headers: { cookie: "kairo_session=invalid.token.here" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("SESSION_EXPIRED");
  });

  // ── Not found ──

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const req = await makeAuthenticatedRequest();
    const res = await POST(req as never);
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

    const req = await makeAuthenticatedRequest();
    const res = await POST(req as never);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_CANCELED");
  });

  // ── No Stripe subscription (db-only) ──

  it("cancels via DB when member has no Stripe subscription", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: null,
      status: "active",
    });
    mockPrisma.member.update.mockResolvedValue({});

    const req = await makeAuthenticatedRequest();
    const res = await POST(req as never);
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
      stripeSubId: "sub_test_123",
      status: "active",
    });

    const req = await makeAuthenticatedRequest();
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.method).toBe("stripe_cancel_at_period_end");

    expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith("sub_test_123", {
      cancel_at_period_end: true,
    });
  });

  // ── Error handling ──

  it("returns 500 on Stripe API error", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      stripeSubId: "sub_test_123",
      status: "active",
    });
    mockStripeSubscriptionsUpdate.mockRejectedValue(new Error("Stripe down"));

    const req = await makeAuthenticatedRequest();
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CANCEL_ERROR");
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findUnique.mockRejectedValue(new Error("DB timeout"));

    const req = await makeAuthenticatedRequest();
    const res = await POST(req as never);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("CANCEL_ERROR");
  });
});
