import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { notifyAdmin } from "@/services/email";

/**
 * POST /api/webhook
 *
 * Handles Stripe webhook events. MVP: only `checkout.session.completed`.
 *
 * Security:
 * - Signature verification via stripe.webhooks.constructEvent()
 * - Idempotency via StripeEvent table
 * - Raw body used (not JSON parsed) for signature verification
 * - No PII logged
 */
export async function POST(request: NextRequest) {
  // 1. Read raw body — Stripe needs the raw string for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_ERROR",
          message: "Missing stripe-signature header",
        },
      },
      { status: 400 }
    );
  }

  // 2. Verify signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    console.error("[webhook] Signature verification failed:", message);
    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_SIGNATURE_ERROR",
          message: "Invalid signature",
        },
      },
      { status: 400 }
    );
  }

  // 3. Idempotency check — skip already-processed events
  const existingEvent = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
  });

  if (existingEvent) {
    // Already processed — return 200 to acknowledge
    return NextResponse.json({ received: true, status: "already_processed" });
  }

  // 4. Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (!email) {
      console.error("[webhook] checkout.session.completed missing email");
      return NextResponse.json(
        {
          error: {
            code: "WEBHOOK_ERROR",
            message: "Session missing customer email",
          },
        },
        { status: 400 }
      );
    }

    if (!customerId || !subscriptionId) {
      console.error(
        "[webhook] checkout.session.completed missing customer or subscription ID"
      );
      return NextResponse.json(
        {
          error: {
            code: "WEBHOOK_ERROR",
            message: "Session missing customer or subscription ID",
          },
        },
        { status: 400 }
      );
    }

    // 5. Record event for idempotency (before processing to prevent race conditions)
    await prisma.stripeEvent.create({
      data: { id: event.id },
    });

    // 6. Upsert member — create if new, update if existing
    await prisma.member.upsert({
      where: { email },
      create: {
        email,
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
        status: "active",
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
        status: "active",
      },
    });

    // 7. Notify admin (fire-and-forget — don't fail the webhook)
    try {
      await notifyAdmin({
        memberEmail: email,
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
      });
    } catch (emailErr) {
      // Log but don't fail — the member is already activated
      console.error("[webhook] Admin notification failed (non-fatal)");
    }

    return NextResponse.json({ received: true, status: "processed" });
  }

  // Unknown event type — acknowledge without processing
  return NextResponse.json({ received: true, status: "ignored" });
}
