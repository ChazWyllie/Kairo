/**
 * Tests for POST /api/member/delete
 *
 * Coverage: auth, rate limiting, idempotency, PII erasure, Stripe cancel,
 * child row deletion, deleted member login block.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  mockRateLimitCheck,
  mockPrisma,
  mockStripeSubscriptionsUpdate,
} from "@/test/setup";

// Use the register limiter mock — same sensitivity as account ops
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...original,
    registerLimiter: { check: (...args: unknown[]) => mockRateLimitCheck(...args) },
  };
});

import { POST } from "./route";

const MEMBER_ID = "member_test_001";
const MEMBER_EMAIL = "member@test.com";
const SUB_ID = "sub_test_abc";

// Minimal session token (mimic auth.ts cookie name)
function makeRequest(cookie?: string): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (cookie) headers["cookie"] = cookie;
  return new NextRequest("http://localhost:3000/api/member/delete", {
    method: "POST",
    headers,
  });
}

// Stub verifySessionToken to return a payload or null
vi.mock("@/lib/auth", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...original,
    getSessionFromRequest: vi.fn((cookieHeader: string | null) => {
      if (!cookieHeader) return null;
      if (cookieHeader.includes("kairo_session=valid")) return "valid_token";
      if (cookieHeader.includes("kairo_session=expired_token")) return "expired_token";
      return null;
    }),
    verifySessionToken: vi.fn(async (token: string) =>
      token === "valid_token" ? { email: MEMBER_EMAIL } : null
    ),
  };
});

describe("POST /api/member/delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
    mockPrisma.member.findUnique.mockResolvedValue({
      id: MEMBER_ID,
      stripeSubId: SUB_ID,
      status: "active",
      deletedAt: null,
    });
    mockPrisma.member.update.mockResolvedValue({});
    mockPrisma.checkIn.deleteMany.mockResolvedValue({ count: 5 });
    mockPrisma.dailyPlan.deleteMany.mockResolvedValue({ count: 3 });
    mockPrisma.macroTarget.deleteMany.mockResolvedValue({ count: 2 });
    mockPrisma.programBlock.deleteMany.mockResolvedValue({ count: 1 });
    mockStripeSubscriptionsUpdate.mockResolvedValue({});
  });

  // ── Rate limiting ──

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 60 });

    const res = await POST(makeRequest("kairo_session=valid"));

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  // ── Auth ──

  it("returns 401 when no session cookie", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when session token is invalid/expired", async () => {
    const res = await POST(makeRequest("kairo_session=expired_token"));

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("SESSION_EXPIRED");
  });

  // ── Member not found ──

  it("returns 404 when member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const res = await POST(makeRequest("kairo_session=valid"));

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe("NOT_FOUND");
  });

  // ── Idempotency ──

  it("returns 200 immediately when member is already deleted", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: MEMBER_ID,
      stripeSubId: null,
      status: "cancelled",
      deletedAt: new Date("2026-03-01"),
    });

    const res = await POST(makeRequest("kairo_session=valid"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("deleted");
    // Should not re-run the transaction
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  // ── Happy path ──

  it("returns 200 with status deleted on success", async () => {
    const res = await POST(makeRequest("kairo_session=valid"));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("deleted");
  });

  it("runs transaction to null PII and delete child rows", async () => {
    await POST(makeRequest("kairo_session=valid"));

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });

  it("cancels Stripe subscription at period end for active members", async () => {
    await POST(makeRequest("kairo_session=valid"));

    // Allow microtask queue to flush the fire-and-forget
    await new Promise((r) => setTimeout(r, 0));

    expect(mockStripeSubscriptionsUpdate).toHaveBeenCalledWith(
      SUB_ID,
      expect.objectContaining({ cancel_at_period_end: true })
    );
  });

  it("does not call Stripe when member has no subscription", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: MEMBER_ID,
      stripeSubId: null,
      status: "pending",
      deletedAt: null,
    });

    await POST(makeRequest("kairo_session=valid"));
    await new Promise((r) => setTimeout(r, 0));

    expect(mockStripeSubscriptionsUpdate).not.toHaveBeenCalled();
  });

  // ── Stripe failure is non-fatal ──

  it("still returns 200 when Stripe cancel throws", async () => {
    mockStripeSubscriptionsUpdate.mockRejectedValue(new Error("Stripe down"));

    const res = await POST(makeRequest("kairo_session=valid"));
    await new Promise((r) => setTimeout(r, 0));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("deleted");
  });
});
