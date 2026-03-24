/**
 * Tests for POST /api/checkout/templates
 *
 * Coverage: rate limiting, priceId validation, allowlist enforcement,
 * Stripe session creation, and error handling.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockRateLimitCheck, mockStripeCheckoutCreate } from "@/test/setup";
import { env } from "@/lib/env";

import { POST } from "./route";

const ALLOWED_PRICE_ID = "price_template_workout_test";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/checkout/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout/templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
    // Set a template price ID in the mocked env
    (env as Record<string, unknown>).STRIPE_TEMPLATE_WORKOUT_PRICE_ID = ALLOWED_PRICE_ID;
    mockStripeCheckoutCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/pay/cs_test_templates",
    });
  });

  afterEach(() => {
    (env as Record<string, unknown>).STRIPE_TEMPLATE_WORKOUT_PRICE_ID = undefined;
    (env as Record<string, unknown>).STRIPE_TEMPLATE_NUTRITION_PRICE_ID = undefined;
    (env as Record<string, unknown>).STRIPE_TEMPLATE_SUPPLEMENTS_PRICE_ID = undefined;
    (env as Record<string, unknown>).STRIPE_TEMPLATE_BUNDLE_PRICE_ID = undefined;
  });

  // ── Rate limiting ──

  it("returns 429 when rate limit is exceeded", async () => {
    mockRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 60 });

    const res = await POST(makeRequest({ priceId: ALLOWED_PRICE_ID }));

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  // ── Input validation ──

  it("returns 400 for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost:3000/api/checkout/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_JSON");
  });

  it("returns 400 when priceId does not start with 'price_'", async () => {
    const res = await POST(makeRequest({ priceId: "invalid_id" }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when priceId is missing", async () => {
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
  });

  // ── Allowlist enforcement ──

  it("returns 503 when no template price IDs are configured", async () => {
    (env as Record<string, unknown>).STRIPE_TEMPLATE_WORKOUT_PRICE_ID = undefined;

    const res = await POST(makeRequest({ priceId: "price_some_id" }));

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error.code).toBe("NOT_AVAILABLE");
  });

  it("returns 400 when priceId is not in the allowlist", async () => {
    const res = await POST(makeRequest({ priceId: "price_not_in_allowlist" }));

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("INVALID_PLAN");
  });

  // ── Happy path ──

  it("returns checkout URL for a valid allowed priceId", async () => {
    const res = await POST(makeRequest({ priceId: ALLOWED_PRICE_ID }));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/pay/cs_test_templates");
  });

  it("creates Stripe session with correct parameters", async () => {
    await POST(makeRequest({ priceId: ALLOWED_PRICE_ID }));

    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        line_items: [{ price: ALLOWED_PRICE_ID, quantity: 1 }],
        payment_method_types: ["card"],
      })
    );
  });

  // ── Error handling ──

  it("returns 500 when Stripe throws an error", async () => {
    mockStripeCheckoutCreate.mockRejectedValue(new Error("Stripe unavailable"));

    const res = await POST(makeRequest({ priceId: ALLOWED_PRICE_ID }));

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe("CHECKOUT_ERROR");
  });

  it("returns 500 when Stripe returns a session without URL", async () => {
    mockStripeCheckoutCreate.mockResolvedValue({ url: null });

    const res = await POST(makeRequest({ priceId: ALLOWED_PRICE_ID }));

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe("CHECKOUT_ERROR");
  });
});
