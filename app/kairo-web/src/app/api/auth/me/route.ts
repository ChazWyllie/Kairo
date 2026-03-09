import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifySessionToken,
  getSessionFromRequest,
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
      goal: true,
      daysPerWeek: true,
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

  // Explicitly build safe response — never leak Stripe IDs, passwordHash, or
  // any field not in the select above (defense in depth against future schema changes).
  return NextResponse.json({
    member: {
      email: member.email,
      status: member.status,
      planTier: member.planTier,
      billingInterval: member.billingInterval,
      goal: member.goal,
      daysPerWeek: member.daysPerWeek,
      fullName: member.fullName,
      onboardedAt: member.onboardedAt,
      createdAt: member.createdAt,
    },
  });
}
