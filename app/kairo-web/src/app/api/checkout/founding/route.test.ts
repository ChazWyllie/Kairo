import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  mockPrisma,
  mockRateLimitCheck,
  mockStripeCheckoutCreate,
} from "@/test/setup";
import { POST } from "@/app/api/checkout/founding/route";

function makeRequest(body: Record<string, unknown> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/checkout/founding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkout/founding", () => {
  const originalCouponId = env.FOUNDING_MEMBER_COUPON_ID;

  beforeEach(() => {
    mockStripeCheckoutCreate.mockReset();
    mockPrisma.member.upsert.mockReset();
    mockPrisma.application.findUnique.mockReset();
    mockPrisma.application.update.mockReset();
    mockRateLimitCheck.mockReset();
    mockRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
    env.FOUNDING_MEMBER_COUPON_ID = originalCouponId;
  });

  it("returns NOT_AVAILABLE when FOUNDING_MEMBER_COUPON_ID is missing", async () => {
    env.FOUNDING_MEMBER_COUPON_ID = undefined;

    const response = await POST(
      makeRequest({
        email: "founding@test.com",
        tier: "foundation",
        interval: "monthly",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error.code).toBe("NOT_AVAILABLE");
    expect(mockStripeCheckoutCreate).not.toHaveBeenCalled();
  });

  it("creates checkout session and applies founding coupon", async () => {
    env.FOUNDING_MEMBER_COUPON_ID = "coupon_founding_10";
    mockPrisma.member.upsert.mockResolvedValue({});
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockStripeCheckoutCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/session/test",
    });

    const response = await POST(
      makeRequest({
        email: "founding@test.com",
        tier: "foundation",
        interval: "monthly",
      })
    );
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ url: "https://checkout.stripe.com/session/test" });
    expect(mockStripeCheckoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        discounts: [{ coupon: "coupon_founding_10" }],
      })
    );
  });
});
