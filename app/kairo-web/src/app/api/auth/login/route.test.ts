/**
 * Tests for POST /api/auth/login
 *
 * Covers: Zod validation, rate limiting, coach auth (constant-time),
 * member auth (bcrypt), session cookie setting, error handling.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mockPrisma,
  mockLoginRateLimitCheck,
} from "@/test/setup";

// Mock bcryptjs — dynamically imported by the route via `await import("bcryptjs")`
const { mockBcryptCompare } = vi.hoisted(() => ({
  mockBcryptCompare: vi.fn(),
}));

vi.mock("bcryptjs", () => ({
  default: { compare: mockBcryptCompare },
  compare: mockBcryptCompare,
}));

const { POST } = await import("./route");

const TEST_EMAIL = "member@test.com";

function makeLoginRequest(
  body: Record<string, unknown>,
  headers?: Record<string, string>
): Request {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockBcryptCompare.mockReset();
    mockLoginRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
  });

  // ── Validation ──

  describe("validation", () => {
    it("returns 400 when body is empty", async () => {
      const res = await POST(
        makeLoginRequest({}) as never
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is missing", async () => {
      const res = await POST(
        makeLoginRequest({ password: "secret123" }) as never
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is missing", async () => {
      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL }) as never
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const res = await POST(
        makeLoginRequest({ email: "not-an-email", password: "secret123" }) as never
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when password is empty string", async () => {
      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "" }) as never
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when body is not valid JSON", async () => {
      const req = new Request("http://localhost:3000/api/auth/login", {
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
      mockLoginRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 60 });

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "secret123" }) as never
      );
      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.error.code).toBe("RATE_LIMITED");
      expect(res.headers.get("Retry-After")).toBe("60");
    });

    it("passes IP and email to rate limiter", async () => {
      // Will hit 401 after rate check passes — that's fine for this assertion
      mockPrisma.member.findUnique.mockResolvedValue(null);

      await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "secret123" }) as never
      );

      expect(mockLoginRateLimitCheck).toHaveBeenCalledWith(
        expect.stringContaining(TEST_EMAIL)
      );
    });
  });

  // ── Coach auth ──

  describe("coach auth", () => {
    it("returns role=coach when password matches COACH_SECRET", async () => {
      const res = await POST(
        makeLoginRequest({
          email: "coach@test.com",
          password: "test-coach-secret-1234567890",
        }) as never
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.role).toBe("coach");
      expect(body.status).toBe("ok");
    });

    it("sets session cookie for coach login", async () => {
      const res = await POST(
        makeLoginRequest({
          email: "coach@test.com",
          password: "test-coach-secret-1234567890",
        }) as never
      );
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toBeTruthy();
      expect(cookie).toContain("kairo_session=");
    });

    it("does not query database for coach login", async () => {
      await POST(
        makeLoginRequest({
          email: "coach@test.com",
          password: "test-coach-secret-1234567890",
        }) as never
      );
      expect(mockPrisma.member.findUnique).not.toHaveBeenCalled();
    });
  });

  // ── Member auth ──

  describe("member auth", () => {
    it("returns 401 when member not found", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "secret123" }) as never
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 when member has no passwordHash", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: null,
        status: "active",
      });

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "secret123" }) as never
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 when password does not match", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2a$12$hashhere",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(false as never);

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "wrong-password" }) as never
      );
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 200 with role=member on valid credentials", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2a$12$hashhere",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(true as never);

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "correct-password" }) as never
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.role).toBe("member");
      expect(body.memberStatus).toBe("active");
    });

    it("sets session cookie on valid member login", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2a$12$hashhere",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(true as never);

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "correct-password" }) as never
      );
      const cookie = res.headers.get("Set-Cookie");
      expect(cookie).toBeTruthy();
      expect(cookie).toContain("kairo_session=");
      expect(cookie).toContain("HttpOnly");
      expect(cookie).toContain("SameSite=Strict");
    });

    it("returns memberStatus reflecting DB status", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2a$12$hashhere",
        status: "canceled",
      });
      mockBcryptCompare.mockResolvedValue(true as never);

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "correct-password" }) as never
      );
      const body = await res.json();
      expect(body.memberStatus).toBe("canceled");
    });
  });

  // ── Error handling ──

  describe("error handling", () => {
    it("returns 500 on unexpected error", async () => {
      mockPrisma.member.findUnique.mockRejectedValue(new Error("DB down"));

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "secret123" }) as never
      );
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error.code).toBe("LOGIN_ERROR");
    });
  });

  // ── Coach session cookie ──

  describe("coach_session cookie", () => {
    it("sets coach_session cookie alongside kairo_session on coach login", async () => {
      const res = await POST(
        makeLoginRequest({
          email: "coach@test.com",
          password: "test-coach-secret-1234567890",
        }) as never
      );

      // NextResponse may set multiple cookies — check all Set-Cookie values
      const cookies = res.headers.getSetCookie
        ? res.headers.getSetCookie()
        : [res.headers.get("Set-Cookie") ?? ""];
      const allCookies = cookies.join(", ");

      expect(allCookies).toContain("kairo_session=");
      expect(allCookies).toContain("coach_session=");
    });
  });

  // ── Anti-enumeration ──

  describe("anti-enumeration", () => {
    it("returns same error code for wrong password as for member not found", async () => {
      // Case 1: member not found
      mockPrisma.member.findUnique.mockResolvedValue(null);
      const resNotFound = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "wrongpassword" }) as never
      );
      const bodyNotFound = await resNotFound.json();

      // Case 2: wrong password
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2a$12$hashhere",
        status: "active",
      });
      mockBcryptCompare.mockResolvedValue(false as never);
      const resWrongPass = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "wrongpassword" }) as never
      );
      const bodyWrongPass = await resWrongPass.json();

      expect(resNotFound.status).toBe(401);
      expect(resWrongPass.status).toBe(401);
      expect(bodyNotFound.error.code).toBe(bodyWrongPass.error.code);
      expect(bodyNotFound.error.message).toBe(bodyWrongPass.error.message);
    });
  });

  // ── past_due member ──

  describe("past_due member login", () => {
    it("allows past_due member to log in and reflects status in response", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        passwordHash: "$2a$12$hashhere",
        status: "past_due",
      });
      mockBcryptCompare.mockResolvedValue(true as never);

      const res = await POST(
        makeLoginRequest({ email: TEST_EMAIL, password: "correct-password" }) as never
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.role).toBe("member");
      expect(body.memberStatus).toBe("past_due");
    });
  });
});
