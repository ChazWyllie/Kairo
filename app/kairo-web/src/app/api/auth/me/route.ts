import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  verifySessionToken,
  getSessionFromRequest,
  requireCoachAuth,
} from "@/lib/auth";

/**
 * GET /api/auth/me
 *
 * Returns the authenticated member's profile.
 * Requires a valid session cookie.
 *
 * Security:
 * - Session token verified via HMAC
 * - No Stripe IDs returned
 * - No PII logged
 */
export async function GET(request: NextRequest) {
  // Coach session: return role + admin email (no member record for coaches)
  if (requireCoachAuth(request)) {
    return NextResponse.json({ role: "coach", member: null, coachEmail: env.ADMIN_NOTIFY_EMAIL });
  }

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

  const member = await prisma.member.findUnique({
    where: { email: payload.email },
    select: {
      email: true,
      status: true,
      planTier: true,
      billingInterval: true,
      isFoundingMember: true,
      goal: true,
      daysPerWeek: true,
      minutesPerSession: true,
      injuries: true,
      fullName: true,
      onboardedAt: true,
      createdAt: true,
    },
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

  return NextResponse.json({ role: "member", member });
}
