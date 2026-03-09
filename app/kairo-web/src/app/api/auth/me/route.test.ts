/**
 * Tests for GET /api/auth/me
 *
 * Coverage: missing cookie (401), expired/invalid token (401),
 * member-not-found (404), happy path, no Stripe IDs in response.
 * Auth lib mocked.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";

// Mock auth lib
const mockVerifySessionToken = vi.fn();
const mockGetSessionFromRequest = vi.fn();

vi.mock("@/lib/auth", () => ({
  createSessionToken: vi.fn(),
  getSessionCookieConfig: vi.fn(),
  verifySessionToken: (...args: unknown[]) => mockVerifySessionToken(...args),
  getSessionFromRequest: (...args: unknown[]) => mockGetSessionFromRequest(...args),
  getClearSessionCookie: vi.fn().mockReturnValue("kairo_session=; Path=/; HttpOnly; Max-Age=0"),
  SESSION_COOKIE_NAME: "kairo_session",
}));

const { GET } = await import("@/app/api/auth/me/route");

function makeRequest(cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookie) {
    headers["cookie"] = cookie;
  }
  return new NextRequest("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers,
  });
}

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockVerifySessionToken.mockReset();
    mockGetSessionFromRequest.mockReset();
  });

  // ── No session ──

  it("returns 401 when no session cookie is present", async () => {
    mockGetSessionFromRequest.mockReturnValue(null);

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  // ── Invalid/expired token ──

  it("returns 401 when token is invalid or expired", async () => {
    mockGetSessionFromRequest.mockReturnValue("bad_token");
    mockVerifySessionToken.mockResolvedValue(null);

    const res = await GET(makeRequest("kairo_session=bad_token"));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("SESSION_EXPIRED");
  });

  // ── Member not found ──

  it("returns 404 when token is valid but member no longer exists", async () => {
    mockGetSessionFromRequest.mockReturnValue("valid_token");
    mockVerifySessionToken.mockResolvedValue({ email: "ghost@test.com", iat: 1, exp: 9999999999 });
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const res = await GET(makeRequest("kairo_session=valid_token"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe("NOT_FOUND");
  });

  // ── Happy path ──

  it("returns member profile for valid session", async () => {
    mockGetSessionFromRequest.mockReturnValue("valid_token");
    mockVerifySessionToken.mockResolvedValue({ email: "user@test.com", iat: 1, exp: 9999999999 });
    mockPrisma.member.findUnique.mockResolvedValue({
      email: "user@test.com",
      status: "active",
      planTier: "coaching",
      billingInterval: "monthly",
      goal: "fat_loss",
      daysPerWeek: 4,
      fullName: "Test User",
      onboardedAt: new Date("2026-03-01"),
      createdAt: new Date("2026-02-28"),
    });

    const res = await GET(makeRequest("kairo_session=valid_token"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.member.email).toBe("user@test.com");
    expect(data.member.status).toBe("active");
    expect(data.member.planTier).toBe("coaching");
  });

  // ── Security ──

  describe("security", () => {
    it("does not return stripeCustomerId or stripeSubId", async () => {
      mockGetSessionFromRequest.mockReturnValue("valid_token");
      mockVerifySessionToken.mockResolvedValue({ email: "user@test.com", iat: 1, exp: 9999999999 });
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "user@test.com",
        status: "active",
        planTier: "foundation",
        billingInterval: "monthly",
        goal: null,
        daysPerWeek: null,
        fullName: null,
        onboardedAt: null,
        createdAt: new Date(),
        // These should NOT be in the select — ensuring route doesn't accidentally include them
        stripeCustomerId: "cus_secret",
        stripeSubId: "sub_secret",
      });

      const res = await GET(makeRequest("kairo_session=valid_token"));
      const data = await res.json();

      expect(data.member.stripeCustomerId).toBeUndefined();
      expect(data.member.stripeSubId).toBeUndefined();
    });

    it("does not expose password hash in response", async () => {
      mockGetSessionFromRequest.mockReturnValue("valid_token");
      mockVerifySessionToken.mockResolvedValue({ email: "user@test.com", iat: 1, exp: 9999999999 });
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "user@test.com",
        status: "active",
        planTier: null,
        billingInterval: null,
        goal: null,
        daysPerWeek: null,
        fullName: null,
        onboardedAt: null,
        createdAt: new Date(),
        passwordHash: "$2b$12$secrethash",
      });

      const res = await GET(makeRequest("kairo_session=valid_token"));
      const text = await res.text();

      expect(text).not.toContain("$2b$12$secrethash");
      expect(text).not.toContain("passwordHash");
    });
  });
});
