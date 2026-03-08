import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/services/stripe";
import {
  verifySessionToken,
  getSessionFromRequest,
} from "@/lib/auth";

/**
 * POST /api/member/cancel
 *
 * Allows an authenticated member to cancel their own subscription.
 * Cancels at period end (they keep access until billing period ends).
 *
 * Security:
 * - Requires valid session cookie
 * - Only the authenticated member can cancel their own subscription
 * - No PII logged
 */
export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie");
  const token = getSessionFromRequest(cookieHeader);

  if (!token) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Not signed in",
        },
      },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return NextResponse.json(
      {
        error: {
          code: "SESSION_EXPIRED",
          message: "Session expired. Please sign in again.",
        },
      },
      { status: 401 }
    );
  }

  try {
    const member = await prisma.member.findUnique({
      where: { email: payload.email },
      select: { stripeSubId: true, status: true },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Member not found",
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
            message: "Your membership is already canceled",
          },
        },
        { status: 409 }
      );
    }

    if (!member.stripeSubId) {
      // No Stripe subscription — just mark as canceled
      await prisma.member.update({
        where: { email: payload.email },
        data: { status: "canceled" },
      });

      return NextResponse.json({ status: "ok", method: "db_only" });
    }

    // Cancel at period end
    await stripe.subscriptions.update(member.stripeSubId, {
      cancel_at_period_end: true,
    });

    console.log("[member/cancel] Self-cancel scheduled");

    return NextResponse.json({ status: "ok", method: "stripe_cancel_at_period_end" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[member/cancel] Error:", message);

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
