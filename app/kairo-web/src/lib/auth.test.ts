/**
 * Tests for lib/auth.ts
 *
 * Covers: createSessionToken, verifySessionToken, getSessionCookieConfig,
 * getClearSessionCookie, getSessionFromRequest, requireCoachAuth,
 * requireCronAuth, requireMemberOrCoachAuth.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import "@/test/setup";

import {
  createSessionToken,
  verifySessionToken,
  getSessionCookieConfig,
  getClearSessionCookie,
  getSessionFromRequest,
  requireCoachAuth,
  requireCronAuth,
  requireMemberOrCoachAuth,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

const COACH_SECRET = "test-coach-secret-1234567890";
const CRON_SECRET = "test-cron-secret-1234567890";
const TEST_EMAIL = "member@test.com";

// ── createSessionToken ──

describe("createSessionToken", () => {
  it("returns a 3-part JWT string", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const parts = token.split(".");
    expect(parts).toHaveLength(3);
  });

  it("encodes the email in the payload", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    expect(payload.email).toBe(TEST_EMAIL);
  });

  it("sets iat to current epoch seconds", async () => {
    const before = Math.floor(Date.now() / 1000);
    const token = await createSessionToken(TEST_EMAIL);
    const after = Math.floor(Date.now() / 1000);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    expect(payload.iat).toBeGreaterThanOrEqual(before);
    expect(payload.iat).toBeLessThanOrEqual(after);
  });

  it("sets exp to 7 days from iat", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
  });

  it("produces base64url-safe characters (no +, /, =)", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    expect(token).not.toMatch(/[+/=]/);
  });
});

// ── verifySessionToken ──

describe("verifySessionToken", () => {
  it("returns payload for a valid token", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.email).toBe(TEST_EMAIL);
  });

  it("returns null for an expired token", async () => {
    // Create a token, then advance time past expiry
    const token = await createSessionToken(TEST_EMAIL);
    const eightDays = 8 * 24 * 60 * 60 * 1000;
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + eightDays);

    const payload = await verifySessionToken(token);
    expect(payload).toBeNull();

    vi.useRealTimers();
  });

  it("returns null for a tampered signature", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const tampered = token.slice(0, -5) + "XXXXX";
    const payload = await verifySessionToken(tampered);
    expect(payload).toBeNull();
  });

  it("returns null for a tampered payload", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const parts = token.split(".");
    // Replace payload with different email
    const fakePayload = Buffer.from(
      JSON.stringify({ email: "evil@attacker.com", iat: 0, exp: 9999999999 })
    )
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const tampered = `${parts[0]}.${fakePayload}.${parts[2]}`;
    const payload = await verifySessionToken(tampered);
    expect(payload).toBeNull();
  });

  it("returns null for malformed token (not 3 parts)", async () => {
    expect(await verifySessionToken("only.two")).toBeNull();
    expect(await verifySessionToken("single")).toBeNull();
    expect(await verifySessionToken("")).toBeNull();
  });

  it("returns null for completely invalid base64", async () => {
    const payload = await verifySessionToken("aaa.!!!.ccc");
    expect(payload).toBeNull();
  });
});

// ── getSessionCookieConfig ──

describe("getSessionCookieConfig", () => {
  it("includes the token value", () => {
    const config = getSessionCookieConfig("my-token");
    expect(config).toContain(`${SESSION_COOKIE_NAME}=my-token`);
  });

  it("sets HttpOnly flag", () => {
    const config = getSessionCookieConfig("token");
    expect(config).toContain("HttpOnly");
  });

  it("sets SameSite=Strict", () => {
    const config = getSessionCookieConfig("token");
    expect(config).toContain("SameSite=Strict");
  });

  it("sets Path=/", () => {
    const config = getSessionCookieConfig("token");
    expect(config).toContain("Path=/");
  });

  it("sets Max-Age to 7 days", () => {
    const config = getSessionCookieConfig("token");
    expect(config).toContain(`Max-Age=${7 * 24 * 60 * 60}`);
  });

  it("omits Secure in non-production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";
    const config = getSessionCookieConfig("token");
    expect(config).not.toContain("Secure");
    process.env.NODE_ENV = original;
  });

  it("includes Secure in production", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const config = getSessionCookieConfig("token");
    expect(config).toContain("Secure");
    process.env.NODE_ENV = original;
  });
});

// ── getClearSessionCookie ──

describe("getClearSessionCookie", () => {
  it("sets Max-Age=0 to expire the cookie", () => {
    const cookie = getClearSessionCookie();
    expect(cookie).toContain("Max-Age=0");
  });

  it("sets cookie value to empty", () => {
    const cookie = getClearSessionCookie();
    expect(cookie).toContain(`${SESSION_COOKIE_NAME}=;`);
  });

  it("includes HttpOnly and SameSite=Strict", () => {
    const cookie = getClearSessionCookie();
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
  });
});

// ── getSessionFromRequest ──

describe("getSessionFromRequest", () => {
  it("returns null when cookieHeader is null", () => {
    expect(getSessionFromRequest(null)).toBeNull();
  });

  it("returns null when cookie name not present", () => {
    expect(getSessionFromRequest("other_cookie=value")).toBeNull();
  });

  it("extracts token from single cookie", () => {
    const result = getSessionFromRequest(`${SESSION_COOKIE_NAME}=mytoken123`);
    expect(result).toBe("mytoken123");
  });

  it("extracts token from multiple cookies", () => {
    const result = getSessionFromRequest(
      `other=foo; ${SESSION_COOKIE_NAME}=mytoken456; another=bar`
    );
    expect(result).toBe("mytoken456");
  });

  it("handles cookie value with dots (JWT-like)", () => {
    const jwt = "header.payload.signature";
    const result = getSessionFromRequest(`${SESSION_COOKIE_NAME}=${jwt}`);
    expect(result).toBe(jwt);
  });
});

// ── requireCoachAuth ──

describe("requireCoachAuth", () => {
  it("returns true for valid coach secret", () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { authorization: `Bearer ${COACH_SECRET}` },
    });
    expect(requireCoachAuth(req)).toBe(true);
  });

  it("returns false for wrong secret", () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(requireCoachAuth(req)).toBe(false);
  });

  it("returns false when no Authorization header", () => {
    const req = new NextRequest("http://localhost:3000/test");
    expect(requireCoachAuth(req)).toBe(false);
  });

  it("returns false for non-Bearer auth scheme", () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { authorization: `Basic ${COACH_SECRET}` },
    });
    expect(requireCoachAuth(req)).toBe(false);
  });
});

// ── requireCronAuth ──

describe("requireCronAuth", () => {
  it("returns true for valid cron secret", () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(requireCronAuth(req)).toBe(true);
  });

  it("returns false for wrong secret", () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { authorization: "Bearer wrong-cron-secret" },
    });
    expect(requireCronAuth(req)).toBe(false);
  });

  it("returns false when no Authorization header", () => {
    const req = new NextRequest("http://localhost:3000/test");
    expect(requireCronAuth(req)).toBe(false);
  });
});

// ── requireMemberOrCoachAuth ──

describe("requireMemberOrCoachAuth", () => {
  it("authorizes coach Bearer token for any email", async () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { authorization: `Bearer ${COACH_SECRET}` },
    });
    const result = await requireMemberOrCoachAuth(req, "anyone@test.com");
    expect(result.authorized).toBe(true);
    expect(result.role).toBe("coach");
    expect(result.email).toBe("anyone@test.com");
  });

  it("authorizes session cookie when email matches", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const result = await requireMemberOrCoachAuth(req, TEST_EMAIL);
    expect(result.authorized).toBe(true);
    expect(result.role).toBe("member");
    expect(result.email).toBe(TEST_EMAIL);
  });

  it("rejects session cookie when email does not match", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const result = await requireMemberOrCoachAuth(req, "other@test.com");
    expect(result.authorized).toBe(false);
  });

  it("email match is case-insensitive", async () => {
    const token = await createSessionToken("User@Test.COM");
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
    });
    const result = await requireMemberOrCoachAuth(req, "user@test.com");
    expect(result.authorized).toBe(true);
    expect(result.role).toBe("member");
  });

  it("returns unauthorized when no auth provided", async () => {
    const req = new NextRequest("http://localhost:3000/test");
    const result = await requireMemberOrCoachAuth(req, TEST_EMAIL);
    expect(result.authorized).toBe(false);
    expect(result.role).toBeNull();
    expect(result.email).toBeNull();
  });

  it("returns unauthorized for invalid session token", async () => {
    const req = new NextRequest("http://localhost:3000/test", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=invalid.jwt.token` },
    });
    const result = await requireMemberOrCoachAuth(req, TEST_EMAIL);
    expect(result.authorized).toBe(false);
  });

  it("prefers coach auth over session cookie", async () => {
    // Both present — coach should win
    const token = await createSessionToken("different@test.com");
    const req = new NextRequest("http://localhost:3000/test", {
      headers: {
        authorization: `Bearer ${COACH_SECRET}`,
        cookie: `${SESSION_COOKIE_NAME}=${token}`,
      },
    });
    const result = await requireMemberOrCoachAuth(req, TEST_EMAIL);
    expect(result.authorized).toBe(true);
    expect(result.role).toBe("coach");
  });
});
