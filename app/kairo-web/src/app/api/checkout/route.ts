import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/checkout
 *
 * Accepts { email, phone? } from the landing page form.
 * 1. Validates input via Zod
 * 2. Upserts a "pending" Member in the database
 * 3. Creates a Stripe Checkout Session (with customer_email pre-filled)
 * 4. Returns { url } for client-side redirect to Stripe's hosted checkout
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - STRIPE_SECRET_KEY stays server-side
 * - No PII logged
 */

const CheckoutSchema = z.object({
  email: z.string().email("A valid email is required"),
  phone: z.string().optional(),
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

    const { email, phone } = parsed.data;

    // Upsert a pending member — webhook will activate on payment success
    await prisma.member.upsert({
      where: { email },
      create: { email, phone: phone || null, status: "pending" },
      update: { phone: phone || null },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: email,
      line_items: [
        {
          price: env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
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
