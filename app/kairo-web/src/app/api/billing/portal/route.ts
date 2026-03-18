import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { requireMemberOrCoachAuth } from "@/lib/auth";

const bodySchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/billing/portal
 *
 * Creates a Stripe Customer Portal session for the authenticated member.
 * Returns { url } for client-side redirect.
 *
 * Auth: member session cookie or coach Bearer token.
 *
 * TODO: Store stripeCustomerId on the Member model to avoid a Stripe
 * customer list lookup on every request.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const { email } = parsed.data;

  const auth = await requireMemberOrCoachAuth(request, email);
  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();

  // Look up the Stripe customer by email
  // TODO: Store stripeCustomerId on Member model to avoid this lookup
  const customers = await stripe.customers.list({ email, limit: 1 });
  if (customers.data.length === 0) {
    return NextResponse.json(
      { error: "No billing account found. Complete your subscription first." },
      { status: 404 }
    );
  }

  const customer = customers.data[0];
  const session = await stripe.billingPortal.sessions.create({
    customer: customer.id,
    return_url: `${env.APP_URL}/dashboard/account`,
  });

  return NextResponse.json({ url: session.url });
}
