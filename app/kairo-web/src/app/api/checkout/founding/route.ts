import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { checkoutLimiter } from "@/lib/rate-limit";
import { getStripePriceId } from "@/lib/stripe-server";
import type { PlanTier, BillingInterval } from "@/lib/stripe-prices";

/**
 * POST /api/checkout/founding
 *
 * Creates a Stripe Checkout Session for founding members.
 * Applies the FOUNDING_COUPON_ID coupon (10% off forever).
 *
 * Expects: { email, tier, interval }
 * Returns: { url } for redirect to Stripe hosted checkout
 *
 * Security:
 * - Zod validation on all inputs
 * - Rate limited (5/60s per IP)
 * - Requires FOUNDING_COUPON_ID to be configured
 * - Price ID resolved server-side (never sent by client)
 */

const FoundingCheckoutSchema = z.object({
  email: z.string().email("A valid email is required"),
  tier: z.enum(["foundation", "coaching", "performance", "vip"]),
  interval: z.enum(["monthly", "annual"]),
});

export async function POST(request: NextRequest) {
  // Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkoutLimiter.check(ip);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // Founding checkout must apply discount while waitlist offer is active
  if (!env.FOUNDING_COUPON_ID) {
    console.error("[founding-checkout] FOUNDING_COUPON_ID not configured");
    return NextResponse.json(
      {
        error: {
          code: "NOT_AVAILABLE",
          message: "Founding member checkout is temporarily unavailable. Please try again shortly.",
        },
      },
      { status: 503 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = FoundingCheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, tier, interval } = parsed.data;

    // Resolve server-side price ID
    let stripePriceId: string;
    try {
      stripePriceId = getStripePriceId(tier as PlanTier, interval as BillingInterval);
    } catch {
      return NextResponse.json(
        { error: { code: "NOT_AVAILABLE", message: "Pricing not configured for this plan." } },
        { status: 503 }
      );
    }

    // Create Stripe Checkout Session with founding coupon (required)
    // Note: Member activation and DB writes happen in the webhook handler
    // (checkout.session.completed) after payment is confirmed — not here.
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      discounts: [{ coupon: env.FOUNDING_COUPON_ID }],
      metadata: {
        planTier: tier,
        billingInterval: interval,
        isFoundingMember: "true",
        foundingCouponId: env.FOUNDING_COUPON_ID,
      },
      success_url: `${env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}&founding=true`,
      cancel_url: `${env.APP_URL}/apply`,
    });

    if (!session.url) {
      console.error("[founding-checkout] Stripe session created without URL");
      return NextResponse.json(
        { error: { code: "CHECKOUT_ERROR", message: "Failed to create checkout session" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[founding-checkout] Error:", message);

    return NextResponse.json(
      { error: { code: "CHECKOUT_ERROR", message: "Failed to create checkout session" } },
      { status: 500 }
    );
  }
}
