/**
 * Tests for POST /api/checkout
 *
 * Coverage: happy path, validation errors, Stripe failures, edge cases.
 * All Stripe calls are mocked — no real API hits.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockStripeCheckoutCreate,
} from "@/test/setup";
import {
  MOCK_CHECKOUT_SESSION,
  MOCK_CHECKOUT_SESSION_NO_URL,
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
  });

  // ── Happy Path ──

  describe("happy path", () => {
    it("creates a checkout session and returns the URL", async () => {
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: MOCK_CHECKOUT_SESSION.url });
    });

    it("passes the correct line_items to Stripe", async () => {
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      await POST(makeRequest());

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          line_items: [{ price: "price_test_fake", quantity: 1 }],
        })
      );
    });

    it("uses default success/cancel URLs from APP_URL", async () => {
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      await POST(makeRequest());

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url:
            "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: "http://localhost:3000/cancel",
        })
      );
    });

    it("accepts custom success and cancel URLs", async () => {
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      await POST(
        makeRequest({
          successUrl: "https://example.com/thanks",
          cancelUrl: "https://example.com/back",
        })
      );

      expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: "https://example.com/thanks",
          cancel_url: "https://example.com/back",
        })
      );
    });
  });

  // ── Validation Errors ──

  describe("validation errors", () => {
    it("returns 400 for invalid successUrl", async () => {
      const response = await POST(
        makeRequest({ successUrl: "not-a-url" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid cancelUrl", async () => {
      const response = await POST(
        makeRequest({ cancelUrl: "not-a-url" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("accepts empty body (all fields optional)", async () => {
      mockStripeCheckoutCreate.mockResolvedValue(MOCK_CHECKOUT_SESSION);

      const response = await POST(makeRequest());
      expect(response.status).toBe(200);
    });
  });

  // ── Stripe Failures ──

  describe("Stripe failures", () => {
    it("returns 500 when Stripe session has no URL", async () => {
      mockStripeCheckoutCreate.mockResolvedValue(
        MOCK_CHECKOUT_SESSION_NO_URL
      );

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
    });

    it("returns 500 when Stripe throws an error", async () => {
      mockStripeCheckoutCreate.mockRejectedValue(
        new Error("Stripe API down")
      );

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
      // Ensure the raw Stripe error message is NOT leaked
      expect(data.error.message).not.toContain("Stripe API down");
    });

    it("handles non-Error throws gracefully", async () => {
      mockStripeCheckoutCreate.mockRejectedValue("string error");

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("CHECKOUT_ERROR");
    });
  });

  // ── Security ──

  describe("security", () => {
    it("never exposes STRIPE_SECRET_KEY in response", async () => {
      mockStripeCheckoutCreate.mockRejectedValue(
        new Error("sk_test_fake is invalid")
      );

      const response = await POST(makeRequest());
      const text = await response.text();

      expect(text).not.toContain("sk_test");
      expect(text).not.toContain("STRIPE_SECRET_KEY");
    });

    it("returns structured error format", async () => {
      mockStripeCheckoutCreate.mockRejectedValue(new Error("boom"));

      const response = await POST(makeRequest());
      const data = await response.json();

      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
    });
  });
});
