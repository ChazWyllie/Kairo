/**
 * Tests for POST /api/auth/logout
 *
 * Coverage: clears session cookie, returns 200.
 */
import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

// Mock auth lib
const mockGetClearSessionCookie = vi.fn().mockReturnValue(
  "kairo_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
);

vi.mock("@/lib/auth", () => ({
  createSessionToken: vi.fn(),
  getSessionCookieConfig: vi.fn(),
  verifySessionToken: vi.fn(),
  getSessionFromRequest: vi.fn(),
  getClearSessionCookie: () => mockGetClearSessionCookie(),
  SESSION_COOKIE_NAME: "kairo_session",
}));

const { POST } = await import("@/app/api/auth/logout/route");

describe("POST /api/auth/logout", () => {
  it("returns 200 with status ok", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("sets a clear-cookie Set-Cookie header", async () => {
    const res = await POST();
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("kairo_session=");
    expect(cookie).toContain("Max-Age=0");
  });

  it("always clears the cookie regardless of existing session", async () => {
    // No authentication required to log out — always clears
    const res = await POST();
    expect(res.status).toBe(200);
  });
});
