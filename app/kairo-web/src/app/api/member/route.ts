import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEmail } from "@/lib/validation";
import { requireMemberOrCoachAuth } from "@/lib/auth";
import { calculateStreak } from "@/lib/streak";

/**
 * GET /api/member?email=...
 *
 * Lookup member profile by email. Returns status, onboarding data,
 * and check-in statistics (total check-ins, current streak).
 *
 * Security:
 * - Requires session cookie (email must match) or coach Bearer token
 * - Email validated before query
 * - Stripe IDs are NOT returned (prevent data leakage)
 * - No PII logged
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Validate email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid email query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    // ── Auth: require session cookie (email match) or coach Bearer token ──
    const auth = await requireMemberOrCoachAuth(request, email);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const member = await prisma.member.findUnique({
      where: { email },
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

    // Calculate total check-ins
    const totalCheckIns = await prisma.checkIn.count({
      where: { memberId: member.id },
    });

    // Get recent check-in dates for streak calculation (last 60 days)
    const recentCheckIns = await prisma.checkIn.findMany({
      where: { memberId: member.id },
      select: { date: true },
      orderBy: { date: "desc" },
      take: 60,
    });

    // Calculate current streak (consecutive days from today/yesterday)
    const currentStreak = calculateStreak(
      recentCheckIns.map((ci) => ci.date)
    );

    return NextResponse.json({
      member: {
        email: member.email,
        status: member.status,
        planTier: member.planTier,
        billingInterval: member.billingInterval,
        goal: member.goal,
        daysPerWeek: member.daysPerWeek,
        minutesPerSession: member.minutesPerSession,
        injuries: member.injuries,
        onboardedAt: member.onboardedAt,
        createdAt: member.createdAt,
      },
      stats: {
        totalCheckIns,
        currentStreak,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown member lookup error";
    console.error("[member] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "MEMBER_ERROR",
          message: "Failed to fetch member data",
        },
      },
      { status: 500 }
    );
  }
}
