import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/member?email=...
 *
 * Lookup member profile by email. Returns status, onboarding data,
 * and check-in statistics (total check-ins, current streak).
 *
 * Security:
 * - No auth (Stripe is the identity provider — MVP)
 * - Email validated before query
 * - Stripe IDs are NOT returned (prevent data leakage)
 * - No PII logged
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
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

/**
 * Calculate the current streak — consecutive days with a check-in,
 * starting from today (or yesterday if no check-in today yet).
 */
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Normalize all dates to midnight UTC for comparison
  const normalized = dates.map((d) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd.getTime();
  });

  // Deduplicate and sort descending
  const unique = [...new Set(normalized)].sort((a, b) => b - a);

  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;

  // Start from today — if no check-in today, try yesterday
  let cursor = today.getTime();
  if (unique[0] !== cursor) {
    cursor = cursor - oneDay; // allow starting from yesterday
    if (unique[0] !== cursor) {
      return 0; // no recent check-in
    }
  }

  for (const dateMs of unique) {
    if (dateMs === cursor) {
      streak++;
      cursor -= oneDay;
    } else if (dateMs < cursor) {
      break; // gap found
    }
  }

  return streak;
}
