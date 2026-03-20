import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/services/stripe";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { notifyAdmin, notifyAdminCancellation, sendWelcomeEmail, sendFoundingMemberWelcome } from "@/services/email";
import { PlanTier, BillingInterval } from "@prisma/client";

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

    // 4b. One-time payment (template purchase) — no subscription to activate.
    //     Atomically record the event + lead conversion so retries are idempotent.
    if (session.mode === "payment") {
      await prisma.$transaction(async (tx) => {
        await tx.stripeEvent.create({ data: { id: event.id } });

        const lead = await tx.lead.findUnique({ where: { email } });
        if (lead && !lead.convertedAt) {
          await tx.lead.update({ where: { email }, data: { convertedAt: new Date() } });
        }
      });

      try {
        if (customerId) {
          await notifyAdmin({
            memberEmail: email,
            stripeCustomerId: customerId,
            stripeSubId: "one-time",
          });
        }
      } catch {
        console.error("[webhook] Admin notification failed (non-fatal)");
      }

      return NextResponse.json({ received: true, status: "processed_one_time" });
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

    // 5. Extract plan metadata (set during checkout)
    const rawPlanTier = session.metadata?.planTier;
    const rawBillingInterval = session.metadata?.billingInterval;
    const planTier = (rawPlanTier && Object.values(PlanTier).includes(rawPlanTier as PlanTier))
      ? (rawPlanTier as PlanTier)
      : null;
    const billingInterval = (rawBillingInterval && Object.values(BillingInterval).includes(rawBillingInterval as BillingInterval))
      ? (rawBillingInterval as BillingInterval)
      : null;

    // 5b. Detect founding member checkout
    const isFoundingMember = session.metadata?.isFoundingMember === "true";
    const foundingCouponId = session.metadata?.foundingCouponId ?? null;

    // 6. Atomically record event + upsert member in a transaction.
    //    If the member upsert fails, the StripeEvent record is rolled back
    //    so Stripe can safely retry the webhook.
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({
        data: { id: event.id },
      });

      await tx.member.upsert({
        where: { email },
        create: {
          email,
          stripeCustomerId: customerId,
          stripeSubId: subscriptionId,
          status: "active",
          planTier,
          billingInterval,
          isFoundingMember,
          foundingMemberAt: isFoundingMember ? new Date() : null,
          foundingCouponId: isFoundingMember ? foundingCouponId : null,
        },
        update: {
          stripeCustomerId: customerId,
          stripeSubId: subscriptionId,
          status: "active",
          planTier,
          billingInterval,
          ...(isFoundingMember && {
            isFoundingMember: true,
            foundingMemberAt: new Date(),
            foundingCouponId,
          }),
        },
      });
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

    // 8. Send welcome email to new member (fire-and-forget)
    try {
      if (isFoundingMember) {
        await sendFoundingMemberWelcome({ email, planTier: planTier ?? undefined });
      } else {
        await sendWelcomeEmail({ memberEmail: email });
      }
    } catch (emailErr) {
      console.error("[webhook] Welcome email failed (non-fatal)");
    }

    // 9. Update lead conversion tracking (fire-and-forget)
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

    // 10. Bridge application→member conversion (fire-and-forget)
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

    // Atomically record event + update member in a transaction.
    // If the member update fails, the StripeEvent record is rolled back
    // so Stripe can safely retry the webhook.
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({
        data: { id: event.id },
      });

      await tx.member.updateMany({
        where: { stripeSubId: subscriptionId },
        data: { status: "canceled" },
      });
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
      await prisma.$transaction(async (tx) => {
        await tx.stripeEvent.create({
          data: { id: event.id },
        });

        await tx.member.updateMany({
          where: { stripeSubId: subscriptionId },
          data: { status: "past_due" },
        });
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
      await prisma.$transaction(async (tx) => {
        await tx.stripeEvent.create({
          data: { id: event.id },
        });

        await tx.member.updateMany({
          where: { stripeSubId: subscriptionId, status: "past_due" },
          data: { status: "active" },
        });
      });
    }

    return NextResponse.json({ received: true, status: "processed" });
  }

  // Unknown event type — acknowledge without processing
  return NextResponse.json({ received: true, status: "ignored" });
}
