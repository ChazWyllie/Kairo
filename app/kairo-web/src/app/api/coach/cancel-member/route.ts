import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCoachAuth } from "@/lib/auth";
import { stripe } from "@/services/stripe";

/**
 * POST /api/coach/cancel-member (Authorization: Bearer COACH_SECRET)
 *
 * Allows coach to cancel a member's Stripe subscription.
 * This immediately cancels (at period end) the subscription in Stripe.
 * The webhook will then mark the member as "canceled" when the sub ends.
 *
 * Security:
 * - Protected by COACH_SECRET
 * - No PII logged
 */

const CancelSchema = z.object({
  email: z.string().email("A valid email is required"),
});

export async function POST(request: NextRequest) {
  // ── Auth: Authorization header with constant-time comparison ──
  if (!requireCoachAuth(request)) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or missing coach secret",
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CancelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const member = await prisma.member.findUnique({
      where: { email },
      select: { stripeSubId: true, status: true },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No member found for this email",
          },
        },
        { status: 404 }
      );
    }

    if (member.status === "canceled") {
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_CANCELED",
            message: "This member is already canceled",
          },
        },
        { status: 409 }
      );
    }

    if (!member.stripeSubId) {
      // No Stripe subscription — just mark as canceled in DB
      await prisma.member.update({
        where: { email },
        data: { status: "canceled" },
      });

      return NextResponse.json({ status: "ok", method: "db_only" });
    }

    // Cancel at period end (member keeps access until billing period ends)
    await stripe.subscriptions.update(member.stripeSubId, {
      cancel_at_period_end: true,
    });

    console.log("[coach/cancel-member] Subscription cancellation scheduled:", {
      email: "***",
    });

    return NextResponse.json({ status: "ok", method: "stripe_cancel_at_period_end" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[coach/cancel-member] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "CANCEL_ERROR",
          message: "Failed to cancel membership",
        },
      },
      { status: 500 }
    );
  }
}
