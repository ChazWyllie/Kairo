/**
 * Tests for POST /api/auth/register
 *
 * Set password for an existing active member.
 * Covers: validation, rate limiting, not eligible (not found, not active,
 * already registered), happy path, errors.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mockPrisma,
  mockRegisterRateLimitCheck,
} from "@/test/setup";

const { mockBcryptHash } = vi.hoisted(() => ({
  mockBcryptHash: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: mockBcryptHash },
  hash: mockBcryptHash,
}));

const { POST } = await import("./route");

const TEST_EMAIL = "member@test.com";

function makeRegisterRequest(
  body: Record<string, unknown>,
  headers?: Record<string, string>
): Request {
  return new Request("http://localhost:3000/api/auth/register", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
    mockBcryptHash.mockReset();
    mockRegisterRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
  });

  // ── Validation ──

  describe("validation", () => {
    it("returns 400 when body is empty", async () => {
      const res = await POST(makeRegisterRequest({}) as never);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is missing", async () => {
      const res = await POST(
        makeRegisterRequest({ password: "validpass123" }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when email is invalid", async () => {
      const res = await POST(
        makeRegisterRequest({ email: "bad", password: "validpass123" }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is too short (< 8 chars)", async () => {
      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "short" }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when password is too long (> 128 chars)", async () => {
      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "x".repeat(129) }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when body is not valid JSON", async () => {
      const req = new Request("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.1" },
        body: "not json",
      });
      const res = await POST(req as never);
      expect(res.status).toBe(400);
    });
  });

  // ── Rate limiting ──

  describe("rate limiting", () => {
    it("returns 429 when rate-limited", async () => {
      mockRegisterRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 120 });

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(res.headers.get("Retry-After")).toBe("120");
    });
  });

  // ── Not eligible ──

  describe("not eligible", () => {
    it("returns 403 when member not found", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("REGISTRATION_FAILED");
    });

    it("returns 403 when member is not active", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "canceled",
        passwordHash: null,
      });

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("REGISTRATION_FAILED");
    });

    it("returns 403 when member already has password", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: "$2a$12$existinghash",
      });

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error.code).toBe("REGISTRATION_FAILED");
    });

    it("uses same error message for all not-eligible cases (anti-enumeration)", async () => {
      // Not found
      mockPrisma.member.findUnique.mockResolvedValue(null);
      const res1 = await POST(
        makeRegisterRequest({ email: "a@b.com", password: "validpass123" }) as never
      );
      const body1 = await res1.json();

      // Already registered
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: "$2a$12$hash",
      });
      const res2 = await POST(
        makeRegisterRequest({ email: "a@b.com", password: "validpass123" }) as never
      );
      const body2 = await res2.json();

      expect(body1.error.message).toBe(body2.error.message);
      expect(res1.status).toBe(res2.status);
    });
  });

  // ── Happy path ──

  describe("happy path", () => {
    it("returns 201 on successful registration", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: null,
      });
      mockBcryptHash.mockResolvedValue("$2a$12$newhash");
      mockPrisma.member.update.mockResolvedValue({});

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.status).toBe("ok");
    });

    it("hashes password with bcrypt cost 12", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: null,
      });
      mockBcryptHash.mockResolvedValue("$2a$12$newhash");
      mockPrisma.member.update.mockResolvedValue({});

      await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "mypassword" }) as never
      );

      expect(mockBcryptHash).toHaveBeenCalledWith("mypassword", 12);
    });

    it("stores hashed password in database", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: null,
      });
      mockBcryptHash.mockResolvedValue("$2a$12$storedhash");
      mockPrisma.member.update.mockResolvedValue({});

      await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "mypassword" }) as never
      );

      expect(mockPrisma.member.update).toHaveBeenCalledWith({
        where: { email: TEST_EMAIL },
        data: { passwordHash: "$2a$12$storedhash" },
      });
    });

    it("sets session cookie on successful registration", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        id: "m1",
        status: "active",
        passwordHash: null,
      });
      mockBcryptHash.mockResolvedValue("$2a$12$newhash");
      mockPrisma.member.update.mockResolvedValue({});

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toBeTruthy();
      expect(cookie).toContain("kairo_session=");
      expect(cookie).toContain("HttpOnly");
    });
  });

  // ── Error handling ──

  describe("error handling", () => {
    it("returns 500 on unexpected error", async () => {
      mockPrisma.member.findUnique.mockRejectedValue(new Error("DB crash"));

      const res = await POST(
        makeRegisterRequest({ email: TEST_EMAIL, password: "validpass123" }) as never
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("REGISTER_ERROR");
    });
  });
});
