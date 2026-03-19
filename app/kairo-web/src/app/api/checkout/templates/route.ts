import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { checkoutLimiter } from "@/lib/rate-limit";

/**
 * POST /api/checkout/templates
 *
 * Creates a Stripe Checkout Session for one-time template purchases.
 * No account creation — Stripe collects the customer email.
 * Returns { url } for client-side redirect.
 *
 * The priceId is sent from the client but validated server-side against
 * the allowlist of known template price IDs (env vars).
 *
 * TODO: Once Stripe Price IDs are created, add them to .env:
 *   STRIPE_TEMPLATE_WORKOUT_PRICE_ID=price_xxx
 *   STRIPE_TEMPLATE_NUTRITION_PRICE_ID=price_xxx
 *   STRIPE_TEMPLATE_SUPPLEMENTS_PRICE_ID=price_xxx
 *   STRIPE_TEMPLATE_BUNDLE_PRICE_ID=price_xxx
 */

const BodySchema = z.object({
  priceId: z.string().startsWith("price_", "Invalid price ID"),
});

function getAllowedTemplatePriceIds(): Set<string> {
  const ids = new Set<string>();
  const vars = [
    process.env.STRIPE_TEMPLATE_WORKOUT_PRICE_ID,
    process.env.STRIPE_TEMPLATE_NUTRITION_PRICE_ID,
    process.env.STRIPE_TEMPLATE_SUPPLEMENTS_PRICE_ID,
    process.env.STRIPE_TEMPLATE_BUNDLE_PRICE_ID,
  ];
  for (const id of vars) {
    if (id) ids.add(id);
  }
  return ids;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = checkoutLimiter.check(ip);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body" } }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid price ID" } },
      { status: 400 }
    );
  }

  const { priceId } = parsed.data;
  const allowed = getAllowedTemplatePriceIds();

  if (allowed.size === 0) {
    return NextResponse.json(
      { error: { code: "NOT_AVAILABLE", message: "Template purchases are not yet available." } },
      { status: 503 }
    );
  }

  if (!allowed.has(priceId)) {
    return NextResponse.json(
      { error: { code: "INVALID_PLAN", message: "Invalid product selection" } },
      { status: 400 }
    );
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.APP_URL}/#templates`,
      payment_method_types: ["card"],
    });

    if (!session.url) {
      return NextResponse.json(
        { error: { code: "CHECKOUT_ERROR", message: "Failed to create checkout session" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[checkout/templates] Error:", message);
    return NextResponse.json(
      { error: { code: "CHECKOUT_ERROR", message: "Failed to create checkout session" } },
      { status: 500 }
    );
  }
}
