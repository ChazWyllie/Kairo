/**
 * Tests for POST /api/checkout/founding
 *
 * Coverage: happy path, founding-specific assertions (coupon, metadata, success URL),
 * validation errors, rate limiting, Stripe failures, price ID not configured.
 * All Stripe/Prisma calls are mocked — no real API hits.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  mockRateLimitCheck,
  mockStripeCheckoutCreate,
} from "@/test/setup";
import { POST } from "@/app/api/checkout/founding/route";

const mockGetStripePriceId = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stripe-server", () => ({
  getStripePriceId: mockGetStripePriceId,
  ALLOWED_PRICE_IDS: new Set(["price_test_foundation_m"]),
  getPlanFromPriceId: vi.fn(),
}));

const MOCK_SESSION_URL = "https://checkout.stripe.com/session/test";

function makeRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/checkout/founding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout/founding", () => {
  beforeEach(() => {
    mockStripeCheckoutCreate.mockReset();
    mockRateLimitCheck.mockReset();
    mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
    mockGetStripePriceId.mockReset();
    mockGetStripePriceId.mockReturnValue("price_test_foundation_m");
    // Restore the coupon ID configured in setup.ts mock
    env.FOUNDING_COUPON_ID = "coupon_test_founding_10";
  });

  // ── Happy Path ──

  describe("happy path", () => {
    it("creates checkout session and returns URL", async () => {
      mockStripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: MOCK_SESSION_URL });

      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: MOCK_SESSION_URL });
    });

    it("passes correct line_items and customer_email to Stripe", async () => {
      mockStripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: MOCK_SESSION_URL });

      await POST(makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" }));

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: "founding@test.com",
          line_items: [{ price: "price_test_foundation_m", quantity: 1 }],
          mode: "subscription",
        })
      );
    });
  });

  // ── Founding-Specific Assertions ──

  describe("founding member session", () => {
    it("applies founding coupon discount to session", async () => {
      env.FOUNDING_COUPON_ID = "coupon_founding_10";
      mockStripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: MOCK_SESSION_URL });

      await POST(makeRequest({ email: "founding@test.com", tier: "coaching", interval: "annual" }));

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ coupon: "coupon_founding_10" }],
        })
      );
    });

    it("includes isFoundingMember and foundingCouponId in session metadata", async () => {
      env.FOUNDING_COUPON_ID = "coupon_founding_10";
      mockStripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: MOCK_SESSION_URL });

      await POST(makeRequest({ email: "founding@test.com", tier: "performance", interval: "monthly" }));

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            isFoundingMember: "true",
            foundingCouponId: "coupon_founding_10",
          }),
        })
      );
    });

    it("includes &founding=true in success_url", async () => {
      mockStripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: MOCK_SESSION_URL });

      await POST(makeRequest({ email: "founding@test.com", tier: "vip", interval: "annual" }));

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining("&founding=true"),
        })
      );
    });
  });

  // ── Coupon Not Configured ──

  describe("founding coupon not configured", () => {
    it("returns 503 NOT_AVAILABLE when FOUNDING_MEMBER_COUPON_ID is missing", async () => {
      env.FOUNDING_COUPON_ID = undefined;

      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.code).toBe("NOT_AVAILABLE");
      expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    });
  });

  // ── Price ID Not Configured ──

  describe("price ID not configured", () => {
    it("returns 503 when getStripePriceId throws (price env var missing)", async () => {
      mockGetStripePriceId.mockImplementation(() => {
        throw new Error("Stripe price ID not configured for foundation/monthly");
      });

      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error.code).toBe("NOT_AVAILABLE");
      expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    });
  });

  // ── Validation Errors ──

  describe("validation errors", () => {
    it("returns 400 for missing email", async () => {
      const response = await POST(makeRequest({ tier: "foundation", interval: "monthly" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.email).toBeDefined();
    });

    it("returns 400 for invalid email format", async () => {
      const response = await POST(
        makeRequest({ email: "not-an-email", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for missing tier", async () => {
      const response = await POST(makeRequest({ email: "founding@test.com", interval: "monthly" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.tier).toBeDefined();
    });

    it("returns 400 for invalid tier enum", async () => {
      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "premium", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for missing interval", async () => {
      const response = await POST(makeRequest({ email: "founding@test.com", tier: "foundation" }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.interval).toBeDefined();
    });

    it("returns 400 for invalid interval enum", async () => {
      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "weekly" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── Rate Limiting ──

  describe("rate limiting", () => {
    it("returns 429 with Retry-After header when limit exceeded", async () => {
      mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 42 });

      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
      expect(response.headers.get("Retry-After")).toBe("42");
    });

    it("does not call Stripe when rate limited", async () => {
      mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 10 });

      await POST(makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" }));

      expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
    });
  });

  // ── Stripe Failures ──

  describe("Stripe failures", () => {
    it("returns 500 when session is created without URL", async () => {
      mockStripeCheckoutCreate.mockResolvedValue({ id: "cs_test_123", url: null });

      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
    });

    it("returns 500 when Stripe throws, without leaking secrets", async () => {
      mockStripeCheckoutCreate.mockRejectedValue(new Error("sk_live_supersecret network error"));

      const response = await POST(
        makeRequest({ email: "founding@test.com", tier: "foundation", interval: "monthly" })
      );
      const data = await response.json();
      const text = JSON.stringify(data);

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
      expect(text).not.toContain("sk_live");
      expect(text).not.toContain("sk_test");
    });
  });
});
