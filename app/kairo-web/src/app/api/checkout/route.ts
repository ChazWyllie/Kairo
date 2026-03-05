import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/services/stripe";
import { env } from "@/lib/env";

/**
 * POST /api/checkout
 *
 * Creates a Stripe Checkout Session for the Kairo Coaching subscription.
 * Returns { url } for client-side redirect to Stripe's hosted checkout.
 *
 * Security:
 * - Zod input validation
 * - STRIPE_SECRET_KEY stays server-side
 * - No PII logged
 */

const CheckoutSchema = z.object({
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
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

    const { successUrl, cancelUrl } = parsed.data;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url:
        successUrl ?? `${env.APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl ?? `${env.APP_URL}/cancel`,
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
    // Log error type only — never log full Stripe error (may contain PII)
    const message =
      err instanceof Error ? err.message : "Unknown checkout error";
    console.error("[checkout] Error:", message);

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
