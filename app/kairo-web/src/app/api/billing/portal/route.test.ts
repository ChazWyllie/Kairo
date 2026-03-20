/**
 * Tests for POST /api/billing/portal
 *
 * Coverage: rate limiting, input validation, auth, Stripe customer lookup,
 * billing portal session creation, and error handling.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  mockRateLimitCheck,
  mockStripeCustomersList,
  mockStripeBillingPortalCreate,
} from "@/test/setup";

import { POST } from "./route";

const COACH_SECRET = "test-coach-secret-1234567890";

function makeRequest(body: unknown, secret?: string): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret !== undefined) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/billing/portal", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/billing/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
    mockStripeCustomersList.mockResolvedValue({
      data: [{ id: "cus_test_abc" }],
    });
    mockStripeBillingPortalCreate.mockResolvedValue({
      url: "https://billing.stripe.com/session/test",
    });
  });

  // ── Rate limiting ──

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 30 });

    const res = await POST(makeRequest({ email: "member@test.com" }, COACH_SECRET));

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("includes Retry-After header when rate limited", async () => {
    mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 30 });

    const res = await POST(makeRequest({ email: "member@test.com" }, COACH_SECRET));

    expect(res.headers.get("Retry-After")).toBe("30");
  });

  // ── Input validation ──

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/billing/portal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${COACH_SECRET}`,
      },
      body: "not-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({}, COACH_SECRET));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("email is required");
  });

  it("returns 400 when email is malformed", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }, COACH_SECRET));

    expect(res.status).toBe(400);
  });

  // ── Auth ──

  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost:3000/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "member@test.com" }),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  // ── Stripe customer lookup ──

  it("returns 404 when no Stripe customer found for email", async () => {
    mockStripeCustomersList.mockResolvedValue({ data: [] });

    const res = await POST(makeRequest({ email: "member@test.com" }, COACH_SECRET));

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toContain("No billing account found");
  });

  // ── Happy path ──

  it("returns portal URL on success", async () => {
    const res = await POST(makeRequest({ email: "member@test.com" }, COACH_SECRET));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://billing.stripe.com/session/test");
  });

  it("calls Stripe customer list with correct email", async () => {
    await POST(makeRequest({ email: "member@test.com" }, COACH_SECRET));

    expect(mockStripeCustomersList).toHaveBeenCalledWith({
      email: "member@test.com",
      limit: 1,
    });
  });

  it("calls billing portal create with customer ID and return URL", async () => {
    await POST(makeRequest({ email: "member@test.com" }, COACH_SECRET));

    expect(mockStripeBillingPortalCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_test_abc",
        return_url: expect.stringContaining("/dashboard/account"),
      })
    );
  });
});
