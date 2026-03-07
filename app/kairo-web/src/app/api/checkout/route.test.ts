/**
 * Tests for POST /api/checkout
 *
 * Coverage: happy path, validation errors, Stripe failures, edge cases,
 * pending member upsert (with planTier/billingInterval), plan validation,
 * customer_email pre-fill.
 * All Stripe/Prisma calls are mocked — no real API hits.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockStripeCheckoutCreate,
  mockPrisma,
  mockRateLimitCheck,
} from "@/test/setup";
import {
  MOCK_CHECKOUT_SESSION,
  MOCK_CHECKOUT_SESSION_NO_URL,
  TEST_PLAN_ID,
} from "@/test/fixtures";
import { POST } from "@/app/api/checkout/route";

function makeRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout", () => {
  beforeEach(() => {
    mockStripeCheckoutCreate.mockReset();
    mockPrisma.member.upsert.mockReset();
    mockRateLimitCheck.mockReset();
    mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
  });

  // ── Happy Path ──

  describe("happy path", () => {
    it("creates a checkout session and returns the URL", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      const response = await POST(
        makeRequest({ email: "user@test.com", planId: TEST_PLAN_ID })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: MOCK_CHECKOUT_SESSION.url });
    });

    it("passes the correct line_items and customer_email to Stripe", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      await POST(makeRequest({ email: "stripe@test.com", planId: TEST_PLAN_ID }));

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          customer_email: "stripe@test.com",
          line_items: [{ price: TEST_PLAN_ID, quantity: 1 }],
          metadata: {
            planTier: "foundation",
            billingInterval: "monthly",
          },
        })
      );
    });

    it("uses APP_URL-based success/cancel URLs", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      await POST(makeRequest({ email: "url@test.com", planId: TEST_PLAN_ID }));

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url:
            "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "http://localhost:3000",
        })
      );
    });

    it("accepts email with optional phone", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      const response = await POST(
        makeRequest({ email: "phone@test.com", phone: "+15551234567", planId: TEST_PLAN_ID })
      );

      expect(response.status).toBe(200);
    });
  });

  // ── Pending Member Upsert ──

  describe("pending member upsert", () => {
    it("upserts a pending member before creating Stripe session", async () => {
      const callOrder: string[] = [];
      mockPrisma.member.upsert.mockImplementation(async () => {
        callOrder.push("upsert");
        return {};
      });
      mockStripeCheckoutCreate.mockImplementation(async () => {
        callOrder.push("stripe");
        return MOCK_CHECKOUT_SESSION;
      });

      await POST(makeRequest({ email: "order@test.com", phone: "+1555", planId: TEST_PLAN_ID }));

      expect(callOrder).toEqual(["upsert", "stripe"]);
      expect(mockPrisma.member.upsert).toHaveBeenCalledWith({
        where: { email: "order@test.com" },
        create: {
          email: "order@test.com",
          phone: "+1555",
          status: "pending",
          planTier: "foundation",
          billingInterval: "monthly",
        },
        update: {
          phone: "+1555",
          planTier: "foundation",
          billingInterval: "monthly",
        },
      });
    });

    it("stores phone as null when not provided", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      await POST(makeRequest({ email: "nophone@test.com", planId: TEST_PLAN_ID }));

      expect(mockPrisma.member.upsert).toHaveBeenCalledWith({
        where: { email: "nophone@test.com" },
        create: {
          email: "nophone@test.com",
          phone: null,
          status: "pending",
          planTier: "foundation",
          billingInterval: "monthly",
        },
        update: {
          phone: null,
          planTier: "foundation",
          billingInterval: "monthly",
        },
      });
    });
  });

  // ── Validation Errors ──

  describe("validation errors", () => {
    it("returns 400 when email is missing", async () => {
      const response = await POST(makeRequest({ planId: TEST_PLAN_ID }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid email", async () => {
      const response = await POST(makeRequest({ email: "not-an-email", planId: TEST_PLAN_ID }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for non-string email", async () => {
      const response = await POST(makeRequest({ email: 123, planId: TEST_PLAN_ID }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when planId is missing", async () => {
      const response = await POST(makeRequest({ email: "test@test.com" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid planId not in ALLOWED_PRICE_IDS", async () => {
      const response = await POST(
        makeRequest({ email: "test@test.com", planId: "price_fake_invalid" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("INVALID_PLAN");
    });
  });

  // ── Stripe Failures ──

  describe("Stripe failures", () => {
    it("returns 500 when Stripe session has no URL", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(
        MOCK_CHECKOUT_SESSION_NO_URL
      );

      const response = await POST(
        makeRequest({ email: "nourl@test.com", planId: TEST_PLAN_ID })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
    });

    it("returns 500 when Stripe throws an error", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockRejectedValue(
        new Error("Stripe API down")
      );

      const response = await POST(
        makeRequest({ email: "err@test.com", planId: TEST_PLAN_ID })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
      // Ensure the raw Stripe error message is NOT leaked
      expect(data.error.message).not.toContain("Stripe API down");
    });

    it("handles non-Error throws gracefully", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockRejectedValue("string error");

      const response = await POST(
        makeRequest({ email: "str@test.com", planId: TEST_PLAN_ID })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
    });
  });

  // ── Security ──

  describe("security", () => {
    it("never exposes STRIPE_SECRET_KEY in response", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockRejectedValue(
        new Error("sk_test_fake is invalid")
      );

      const response = await POST(
        makeRequest({ email: "sec@test.com", planId: TEST_PLAN_ID })
      );
      const text = await response.text();

      expect(text).not.toContain("sk_test");
      expect(text).not.toContain("STRIPE_SECRET_KEY");
    });

    it("returns structured error format", async () => {
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockRejectedValue(new Error("boom"));

      const response = await POST(
        makeRequest({ email: "fmt@test.com", planId: TEST_PLAN_ID })
      );
      const data = await response.json();

      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
    });
  });

  // ── Rate Limiting ──

  describe("rate limiting", () => {
    it("returns 429 when rate limit is exceeded", async () => {
      mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 42 });

      const response = await POST(
        makeRequest({ email: "rate@test.com", planId: TEST_PLAN_ID })
      );
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(response.headers.get("Retry-After")).toBe("42");
    });

    it("does not call Stripe or Prisma when rate limited", async () => {
      mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 10 });

      await POST(makeRequest({ email: "blocked@test.com", planId: TEST_PLAN_ID }));

      expect(mockPrisma.member.upsert).not.toHaveBeenCalled();
      expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    });

    it("extracts IP from x-forwarded-for header", async () => {
      mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
      mockPrisma.member.upsert.mockResolvedValue({});
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      const req = new NextRequest("http://localhost:3000/api/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.1, 10.0.0.1",
        },
        body: JSON.stringify({ email: "ip@test.com", planId: TEST_PLAN_ID }),
      });

      await POST(req);

      expect(mockRateLimitCheck).toHaveBeenCalledWith("203.0.113.1");
    });
  });
});
