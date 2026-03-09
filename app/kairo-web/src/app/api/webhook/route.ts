import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { notifyAdmin, notifyAdminCancellation, sendWelcomeEmail } from "@/services/email";

/**
 * POST /api/webhook
 *
 * Handles Stripe webhook events:
 *  - checkout.session.completed → activate member
 *  - customer.subscription.deleted → mark member canceled
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
    event = getStripe().webhooks.constructEvent(
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

    // 6. Extract plan metadata (set during checkout)
    const planTier = (session.metadata?.planTier as string) || null;
    const billingInterval = (session.metadata?.billingInterval as string) || null;

    // 7. Upsert member — create if new, update if existing
    await prisma.member.upsert({
      where: { email },
      create: {
        email,
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
        status: "active",
        planTier,
        billingInterval,
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubId: subscriptionId,
        status: "active",
        planTier,
        billingInterval,
      },
    });

    // 8. Notify admin (fire-and-forget — don't fail the webhook)
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

    // 9. Send welcome email to new member (fire-and-forget)
    try {
      await sendWelcomeEmail({ memberEmail: email });
    } catch (emailErr) {
      console.error("[webhook] Welcome email failed (non-fatal)");
    }

    // 10. Update lead conversion tracking (fire-and-forget)
    try {
      const lead = await prisma.lead.findUnique({
        where: { email },
      });
      if (lead && !lead.convertedAt) {
        await prisma.lead.update({
          where: { email },
          data: { convertedAt: new Date() },
        });
      }
    } catch (leadErr) {
      // Non-fatal — member is already activated
      console.error("[webhook] Lead conversion tracking failed (non-fatal)");
    }

    // 11. Bridge application→member conversion (fire-and-forget)
    try {
      const application = await prisma.application.findUnique({
        where: { email },
      });
      if (application && !application.convertedToMember) {
        await prisma.application.update({
          where: { email },
          data: { convertedToMember: true },
        });
      }
    } catch (appErr) {
      // Non-fatal — member is already activated
      console.error("[webhook] Application conversion tracking failed (non-fatal)");
    }

    return NextResponse.json({ received: true, status: "processed" });
  }

  // ── customer.subscription.deleted — mark member as canceled ──

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId =
      typeof subscription.id === "string" ? subscription.id : null;

    if (!subscriptionId) {
      console.error(
        "[webhook] customer.subscription.deleted missing subscription ID"
      );
      return NextResponse.json(
        {
          error: {
            code: "WEBHOOK_ERROR",
            message: "Subscription missing ID",
          },
        },
        { status: 400 }
      );
    }

    // Record event for idempotency
    await prisma.stripeEvent.create({
      data: { id: event.id },
    });

    // Mark the member as canceled
    await prisma.member.updateMany({
      where: { stripeSubId: subscriptionId },
      data: { status: "canceled" },
    });

    // Notify admin of cancellation (fire-and-forget)
    try {
      await notifyAdminCancellation({ stripeSubId: subscriptionId });
    } catch (emailErr) {
      console.error("[webhook] Cancellation notification failed (non-fatal)");
    }

    return NextResponse.json({ received: true, status: "processed" });
  }

  // ── invoice.payment_failed — mark member as past_due ──

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    const subDetails = invoice.parent?.subscription_details;
    const subscriptionId =
      subDetails
        ? typeof subDetails.subscription === "string"
          ? subDetails.subscription
          : subDetails.subscription?.id ?? null
        : null;

    if (subscriptionId) {
      // Record event for idempotency
      await prisma.stripeEvent.create({
        data: { id: event.id },
      });

      await prisma.member.updateMany({
        where: { stripeSubId: subscriptionId },
        data: { status: "past_due" },
      });
    }

    return NextResponse.json({ received: true, status: "processed" });
  }

  // ── invoice.payment_succeeded — restore active status if was past_due ──

  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;
    const subDetails = invoice.parent?.subscription_details;
    const subscriptionId =
      subDetails
        ? typeof subDetails.subscription === "string"
          ? subDetails.subscription
          : subDetails.subscription?.id ?? null
        : null;

    if (subscriptionId) {
      // Record event for idempotency
      await prisma.stripeEvent.create({
        data: { id: event.id },
      });

      await prisma.member.updateMany({
        where: { stripeSubId: subscriptionId, status: "past_due" },
        data: { status: "active" },
      });
    }

    return NextResponse.json({ received: true, status: "processed" });
  }

  // Unknown event type — acknowledge without processing
  return NextResponse.json({ received: true, status: "ignored" });
}
