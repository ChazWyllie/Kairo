/**
 * Tests for POST /api/auth/login
 *
 * Coverage: Zod validation, coach auth (constant-time), member auth,
 * invalid credentials, session cookie set, error handling.
 * bcrypt and auth lib mocked — no real crypto.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";

// Mock bcryptjs before imports
const mockBcryptCompare = vi.fn();
vi.mock("bcryptjs", () => ({
  default: { compare: mockBcryptCompare },
  compare: mockBcryptCompare,
}));

// Mock auth lib
const mockCreateSessionToken = vi.fn().mockResolvedValue("mock_session_token");
const mockGetSessionCookieConfig = vi.fn().mockReturnValue("kairo_session=mock_token; Path=/; HttpOnly");

vi.mock("@/lib/auth", () => ({
  createSessionToken: (...args: unknown[]) => mockCreateSessionToken(...args),
  getSessionCookieConfig: (...args: unknown[]) => mockGetSessionCookieConfig(...args),
  verifySessionToken: vi.fn(),
  getSessionFromRequest: vi.fn(),
  getClearSessionCookie: vi.fn().mockReturnValue("kairo_session=; Path=/; HttpOnly; Max-Age=0"),
  SESSION_COOKIE_NAME: "kairo_session",
}));

const { POST } = await import("@/app/api/auth/login/route");

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockBcryptCompare.mockReset();
    mockCreateSessionToken.mockResolvedValue("mock_session_token");
    mockGetSessionCookieConfig.mockReturnValue("kairo_session=mock_token; Path=/; HttpOnly");
  });

  // ── Validation ──

  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ password: "pass123" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const res = await POST(makeRequest({ email: "notanemail", password: "pass123" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(makeRequest({ email: "test@test.com" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── Member auth ──

  describe("member auth", () => {
    it("returns 401 when member does not exist", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(makeRequest({ email: "nobody@test.com", password: "pass123" }));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 when member has no password hash (not registered)", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: null,
        status: "active",
      });

      const res = await POST(makeRequest({ email: "nopw@test.com", password: "pass123" }));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 when password is wrong", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2b$12$fakehash",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(false);

      const res = await POST(makeRequest({ email: "member@test.com", password: "wrongpass" }));
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 200 and sets session cookie on valid login", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2b$12$fakehash",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(true);

      const res = await POST(makeRequest({ email: "member@test.com", password: "correctpass" }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.role).toBe("member");
      expect(res.headers.get("set-cookie")).toContain("kairo_session");
    });

    it("never reveals whether the email exists in error messages", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res1 = await POST(makeRequest({ email: "exists@test.com", password: "wrong" }));
      const data1 = await res1.json();

      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2b$12$fakehash",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(false);

      const res2 = await POST(makeRequest({ email: "exists@test.com", password: "wrong" }));
      const data2 = await res2.json();

      // Both should return the same generic message
      expect(data1.error.message).toBe(data2.error.message);
    });
  });

  // ── Coach auth ──

  describe("coach auth", () => {
    it("returns 200 with role=coach when password matches COACH_SECRET", async () => {
      const res = await POST(
        makeRequest({ email: "coach@test.com", password: "test-coach-secret-1234567890" })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(data.role).toBe("coach");
      expect(res.headers.get("set-cookie")).toContain("kairo_session");
    });

    it("does not call bcrypt for coach auth path", async () => {
      await POST(
        makeRequest({ email: "coach@test.com", password: "test-coach-secret-1234567890" })
      );
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });
  });

  // ── Security ──

  describe("security", () => {
    it("never exposes password hash in error response", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2b$12$verysecrethashabcdef",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(false);

      const res = await POST(makeRequest({ email: "member@test.com", password: "wrong" }));
      const text = await res.text();

      expect(text).not.toContain("$2b$12$");
      expect(text).not.toContain("verysecrethashabcdef");
    });

    it("returns structured error format on all failures", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(makeRequest({ email: "any@test.com", password: "any" }));
      const data = await res.json();

      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
    });

    it("returns 500 when database throws", async () => {
      mockPrisma.member.findUnique.mockRejectedValue(new Error("DB down"));

      const res = await POST(makeRequest({ email: "db@test.com", password: "pass" }));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error.code).toBe("LOGIN_ERROR");
    });
  });
});
