import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/services/stripe";
import { verifySessionToken, getSessionFromRequest } from "@/lib/auth";
import { registerLimiter } from "@/lib/rate-limit";

/**
 * POST /api/member/delete
 *
 * GDPR-compliant data erasure for authenticated members.
 *
 * Anonymizes all PII fields on the Member record and deletes associated
 * health tracking rows. Preserves financial fields (email, stripeCustomerId,
 * stripeSubId, planTier, status, createdAt) for 7-year compliance per
 * GDPR Art. 17(3)(b).
 *
 * Security:
 * - Member session cookie required (coach cannot trigger this)
 * - Rate limited (5 per 15 min per IP — same sensitivity as account ops)
 * - No PII logged
 */

// PII fields to null out on Member (financial fields are preserved)
const PII_FIELDS = {
  phone: null,
  passwordHash: null,
  goal: null,
  daysPerWeek: null,
  minutesPerSession: null,
  injuries: null,
  onboardedAt: null,
  fullName: null,
  age: null,
  height: null,
  currentWeight: null,
  bodyFat: null,
  timezone: null,
  occupation: null,
  yearsTraining: null,
  currentSplit: null,
  favoriteLifts: null,
  weakBodyParts: null,
  equipmentAccess: null,
  sessionLength: null,
  currentCalories: null,
  proteinIntake: null,
  mealsPerDay: null,
  foodsEnjoy: null,
  foodsAvoid: null,
  appetiteLevel: null,
  weekendEating: null,
  alcoholIntake: null,
  supplements: null,
  avgSleep: null,
  stressLevel: null,
  stepCount: null,
  jobActivityLevel: null,
  travelFrequency: null,
  fallOffCause: null,
  supportNeeded: null,
  success90Days: null,
};

export async function POST(request: NextRequest) {
  // Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = registerLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  // Auth: member session cookie only
  const cookieHeader = request.headers.get("cookie");
  const token = getSessionFromRequest(cookieHeader);

  if (!token) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json(
      { error: { code: "SESSION_EXPIRED", message: "Session expired. Please sign in again." } },
      { status: 401 }
    );
  }

  try {
    const member = await prisma.member.findUnique({
      where: { email: payload.email },
      select: {
        id: true,
        stripeSubId: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Member not found" } },
        { status: 404 }
      );
    }

    // Idempotent — already deleted
    if (member.deletedAt) {
      return NextResponse.json({ status: "deleted" });
    }

    // Cancel active Stripe subscription at period end (fire-and-forget)
    if (member.stripeSubId && member.status === "active") {
      getStripe()
        .subscriptions.update(member.stripeSubId, { cancel_at_period_end: true })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Unknown Stripe error";
          console.error("[member/delete] Stripe cancel failed (non-fatal):", msg);
        });
    }

    // Atomically: null PII fields + set deletedAt + delete child rows
    await prisma.$transaction([
      prisma.member.update({
        where: { id: member.id },
        data: { ...PII_FIELDS, deletedAt: new Date() },
      }),
      prisma.checkIn.deleteMany({ where: { memberId: member.id } }),
      prisma.dailyPlan.deleteMany({ where: { memberId: member.id } }),
      prisma.macroTarget.deleteMany({ where: { memberId: member.id } }),
      prisma.programBlock.deleteMany({ where: { memberId: member.id } }),
    ]);

    console.log("[member/delete] Member data erased");

    return NextResponse.json({ status: "deleted" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[member/delete] Error:", message);

    return NextResponse.json(
      { error: { code: "DELETE_ERROR", message: "Failed to process deletion request" } },
      { status: 500 }
    );
  }
}
