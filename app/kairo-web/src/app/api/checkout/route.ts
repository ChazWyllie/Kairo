import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkoutLimiter } from "@/lib/rate-limit";
import { ALLOWED_PRICE_IDS, getPlanFromPriceId } from "@/lib/stripe-prices";

/**
 * POST /api/checkout
 *
 * Accepts { email, phone?, planId } from the landing page pricing cards.
 * 1. Validates input via Zod (including planId against ALLOWED_PRICE_IDS)
 * 2. Upserts a "pending" Member with planTier + billingInterval
 * 3. Creates a Stripe Checkout Session with plan metadata
 * 4. Returns { url } for client-side redirect to Stripe's hosted checkout
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - planId validated against allowlist (ALLOWED_PRICE_IDS)
 * - STRIPE_SECRET_KEY stays server-side
 * - No PII logged
 */

const CheckoutSchema = z.object({
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
  planId: z.string().min(1, "Plan selection is required"),
});

export async function POST(request: NextRequest) {
  // Rate limit — 5 requests per 60s per IP (mitigates T-04 Checkout Spam)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkoutLimiter.check(ip);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again later.",
        },
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CheckoutSchema.safeParse(body);

    // Validation failure — safe error, no PII
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

    const { email, phone, planId } = parsed.data;

    // Validate planId against our allowlist
    if (!ALLOWED_PRICE_IDS.has(planId)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PLAN",
            message: "Invalid plan selection",
          },
        },
        { status: 400 }
      );
    }

    // Look up tier + interval from the price ID
    const planInfo = getPlanFromPriceId(planId)!;

    // Upsert a pending member — webhook will activate on payment success
    await prisma.member.upsert({
      where: { email },
      create: {
        email,
        phone: phone || null,
        status: "pending",
        planTier: planInfo.plan.tier,
        billingInterval: planInfo.interval,
      },
      update: {
        phone: phone || null,
        planTier: planInfo.plan.tier,
        billingInterval: planInfo.interval,
      },
    });

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: planId,
          quantity: 1,
        },
      ],
      metadata: {
        planTier: planInfo.plan.tier,
        billingInterval: planInfo.interval,
      },
      success_url: `${env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}`,
    });

    if (!session.url) {
      console.error("[checkout] Stripe session created without URL");
      return NextResponse.json(
        {
          error: {
            code: "CHECKOUT_ERROR",
            message: "Failed to create checkout session",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Log error details for debugging — no PII, just error class + message
    const message =
      err instanceof Error ? err.message : "Unknown checkout error";
    const errorName = err instanceof Error ? err.constructor.name : typeof err;
    console.error("[checkout] Error:", errorName, "-", message);

    // Surface Stripe-specific error codes (safe — these are API codes, not PII)
    const stripeCode =
      err && typeof err === "object" && "type" in err
        ? (err as { type: string }).type
        : undefined;
    if (stripeCode) {
      console.error("[checkout] Stripe error type:", stripeCode);
    }

    return NextResponse.json(
      {
        error: {
          code: "CHECKOUT_ERROR",
          message: "Failed to create checkout session",
        },
      },
      { status: 500 }
    );
  }
}
