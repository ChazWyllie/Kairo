import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { checkoutLimiter } from "@/lib/rate-limit";
import { ALLOWED_PRICE_IDS, getPlanFromPriceId, getStripePriceId } from "@/lib/stripe-server";
import type { PlanTier, BillingInterval } from "@/lib/stripe-prices";

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
  // Accept either planId (legacy) or tier+interval (new — keeps price IDs server-side)
  planId: z.string().min(1).optional(),
  tier: z.enum(["standard", "premium"]).optional(),
  interval: z.enum(["monthly", "annual"]).optional(),
}).refine(
  (d) => d.planId || (d.tier && d.interval),
  { message: "Either planId or tier+interval is required" }
);

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

    const { email, phone } = parsed.data;

    // Resolve Stripe price ID + plan metadata from either path
    let stripePriceId: string;
    let planTier: PlanTier;
    let billingInterval: BillingInterval;

    if (parsed.data.planId) {
      // Legacy path: planId sent directly
      if (!ALLOWED_PRICE_IDS.has(parsed.data.planId)) {
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
      const planInfo = getPlanFromPriceId(parsed.data.planId)!;
      stripePriceId = parsed.data.planId;
      planTier = planInfo.tier;
      billingInterval = planInfo.interval;
    } else {
      // New path: tier + interval (price ID resolved server-side)
      planTier = parsed.data.tier!;
      billingInterval = parsed.data.interval!;
      stripePriceId = getStripePriceId(planTier, billingInterval);
    }

    // Upsert a pending member — webhook will activate on payment success
    await prisma.member.upsert({
      where: { email },
      create: {
        email,
        phone: phone || null,
        status: "pending",
        planTier,
        billingInterval,
      },
      update: {
        phone: phone || null,
        planTier,
        billingInterval,
      },
    });

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      metadata: {
        planTier,
        billingInterval,
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
