/**
 * Tests for POST /api/auth/register
 *
 * Coverage: Zod validation, active-member gate, already-registered guard,
 * bcrypt hashing, session cookie set, error handling.
 * bcrypt and auth lib mocked.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";

// Mock bcryptjs before imports
const mockBcryptHash = vi.fn().mockResolvedValue("$2b$12$mockhash");
vi.mock("bcryptjs", () => ({
  default: { hash: mockBcryptHash, compare: vi.fn() },
  hash: mockBcryptHash,
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

const { POST } = await import("@/app/api/auth/register/route");

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
    mockBcryptHash.mockResolvedValue("$2b$12$mockhash");
    mockCreateSessionToken.mockResolvedValue("mock_session_token");
  });

  // ── Validation ──

  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const res = await POST(makeRequest({ password: "password123" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const res = await POST(makeRequest({ email: "bad", password: "password123" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is too short (< 8 chars)", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "short" }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is too long (> 128 chars)", async () => {
      const res = await POST(makeRequest({ email: "test@test.com", password: "a".repeat(129) }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── Active-member gate ──

  describe("active member gate", () => {
    it("returns 403 when member does not exist", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(makeRequest({ email: "nobody@test.com", password: "password123" }));
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.code).toBe("NOT_ELIGIBLE");
    });

    it("returns 403 when member is pending (not yet paid)", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "pending",
        passwordHash: null,
      });

      const res = await POST(makeRequest({ email: "pending@test.com", password: "password123" }));
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error.code).toBe("NOT_ELIGIBLE");
    });

    it("returns 403 when member is canceled", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "canceled",
        passwordHash: null,
      });

      const res = await POST(makeRequest({ email: "canceled@test.com", password: "password123" }));
      expect(res.status).toBe(403);
    });
  });

  // ── Already registered ──

  it("returns 409 when member already has a password", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      status: "active",
      passwordHash: "$2b$12$existinghash",
    });

    const res = await POST(makeRequest({ email: "existing@test.com", password: "password123" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe("ALREADY_REGISTERED");
  });

  // ── Happy path ──

  it("hashes password and stores it, returns 201 with session cookie", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      status: "active",
      passwordHash: null,
    });
    mockPrisma.member.update.mockResolvedValue({ id: "m1" });

    const res = await POST(makeRequest({ email: "new@test.com", password: "securepass123" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(res.headers.get("set-cookie")).toContain("kairo_session");

    expect(mockBcryptHash).toHaveBeenCalledWith("securepass123", 12);
    expect(mockPrisma.member.update).toHaveBeenCalledWith({
      where: { email: "new@test.com" },
      data: { passwordHash: "$2b$12$mockhash" },
    });
  });

  // ── Security ──

  describe("security", () => {
    it("does not expose the password in any response", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(makeRequest({ email: "test@test.com", password: "supersecret123" }));
      const text = await res.text();

      expect(text).not.toContain("supersecret123");
    });

    it("does not expose the password hash in response", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: null,
      });
      mockPrisma.member.update.mockResolvedValue({ id: "m1" });

      const res = await POST(makeRequest({ email: "new@test.com", password: "password123" }));
      const text = await res.text();

      expect(text).not.toContain("$2b$12$mockhash");
    });

    it("returns 500 on database error", async () => {
      mockPrisma.member.findUnique.mockRejectedValue(new Error("DB down"));

      const res = await POST(makeRequest({ email: "err@test.com", password: "password123" }));
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error.code).toBe("REGISTER_ERROR");
    });
  });
});
