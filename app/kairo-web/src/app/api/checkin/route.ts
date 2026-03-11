import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMemberOrCoachAuth } from "@/lib/auth";
import { createCheckIn, getCheckInHistory } from "@/services/checkin";
import { isValidEmail } from "@/lib/validation";

/**
 * POST /api/checkin
 *
 * Creates a daily check-in for an active member.
 * FR-8: Quick Logging — checklist: workout, meals (0-3), water, steps.
 * Optional "note" for missed-day reasons.
 * One check-in per member per day (unique constraint).
 *
 * GET /api/checkin?email=...&limit=30
 *
 * Fetch check-in history for an active member.
 * FR-10: Insights — streak, weekly adherence, workouts this week.
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - Only active members can check in / view history
 * - Internal IDs (memberId) not exposed in response
 * - No PII logged
 */

const CheckInSchema = z.object({
  email: z.string().email("A valid email is required"),

  // Quick daily fields (Phase 4)
  workout: z.boolean().default(false),
  meals: z.number().int().min(0).max(3).default(0),
  water: z.boolean().default(false),
  steps: z.boolean().default(false),
  note: z.string().max(500).optional(),

  // Enhanced weekly fields (Milestone L)
  avgWeight: z.number().min(50).max(1000).optional(),
  waist: z.number().min(10).max(100).optional(),
  photoSubmitted: z.boolean().optional(),
  frontPhotoUrl: z.string().url().max(2000).optional(),
  sidePhotoUrl: z.string().url().max(2000).optional(),
  backPhotoUrl: z.string().url().max(2000).optional(),
  workoutsCompleted: z.number().int().min(0).max(14).optional(),
  stepsAverage: z.number().int().min(0).max(100000).optional(),
  calorieAdherence: z.number().int().min(1).max(10).optional(),
  proteinAdherence: z.number().int().min(1).max(10).optional(),
  sleepAverage: z.number().min(0).max(24).optional(),
  energyScore: z.number().int().min(1).max(10).optional(),
  hungerScore: z.number().int().min(1).max(10).optional(),
  stressScore: z.number().int().min(1).max(10).optional(),
  digestionScore: z.number().int().min(1).max(10).optional(),
  recoveryScore: z.number().int().min(1).max(10).optional(),
  painNotes: z.string().max(1000).optional(),
  biggestWin: z.string().max(1000).optional(),
  biggestStruggle: z.string().max(1000).optional(),
  helpNeeded: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, workout, meals, water, steps, note, ...enhancedData } = parsed.data;

    // ── Auth: require session cookie (email match) or coach Bearer token ──
    const auth = await requireMemberOrCoachAuth(request, email);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const result = await createCheckIn(
      email,
      { workout, meals, water, steps, note },
      enhancedData
    );

    if (!result.ok) {
      if (result.code === "NOT_FOUND") {
        return NextResponse.json(
          {
            error: {
              code: "NOT_FOUND",
              message: "No active membership found for this email",
            },
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_CHECKED_IN",
            message: "You have already checked in today",
          },
        },
        { status: 409 }
      );
    }

    const ci = result.checkIn;
    return NextResponse.json(
      {
        checkIn: {
          id: ci.id,
          date: ci.date,
          workout: ci.workout,
          meals: ci.meals,
          water: ci.water,
          steps: ci.steps,
          note: ci.note,
          avgWeight: ci.avgWeight,
          waist: ci.waist,
          photoSubmitted: ci.photoSubmitted,
          workoutsCompleted: ci.workoutsCompleted,
          stepsAverage: ci.stepsAverage,
          calorieAdherence: ci.calorieAdherence,
          proteinAdherence: ci.proteinAdherence,
          sleepAverage: ci.sleepAverage,
          energyScore: ci.energyScore,
          hungerScore: ci.hungerScore,
          stressScore: ci.stressScore,
          digestionScore: ci.digestionScore,
          recoveryScore: ci.recoveryScore,
          painNotes: ci.painNotes,
          biggestWin: ci.biggestWin,
          biggestStruggle: ci.biggestStruggle,
          helpNeeded: ci.helpNeeded,
          coachStatus: ci.coachStatus,
          coachResponse: ci.coachResponse,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown check-in error";
    console.error("[checkin] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "CHECKIN_ERROR",
          message: "Failed to save check-in",
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const limitParam = searchParams.get("limit");

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

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 30, 1), 90) : 30;

    // ── Auth: require session cookie (email match) or coach Bearer token ──
    const auth = await requireMemberOrCoachAuth(request, email);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    const history = await getCheckInHistory(email, limit);

    if (!history) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No active membership found for this email",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      checkIns: history.checkIns.map((ci) => ({
        id: ci.id,
        date: ci.date,
        workout: ci.workout,
        meals: ci.meals,
        water: ci.water,
        steps: ci.steps,
        note: ci.note,
        avgWeight: ci.avgWeight,
        waist: ci.waist,
        photoSubmitted: ci.photoSubmitted,
        workoutsCompleted: ci.workoutsCompleted,
        stepsAverage: ci.stepsAverage,
        calorieAdherence: ci.calorieAdherence,
        proteinAdherence: ci.proteinAdherence,
        sleepAverage: ci.sleepAverage,
        energyScore: ci.energyScore,
        hungerScore: ci.hungerScore,
        stressScore: ci.stressScore,
        digestionScore: ci.digestionScore,
        recoveryScore: ci.recoveryScore,
        painNotes: ci.painNotes,
        biggestWin: ci.biggestWin,
        biggestStruggle: ci.biggestStruggle,
        helpNeeded: ci.helpNeeded,
        coachStatus: ci.coachStatus,
        coachResponse: ci.coachResponse,
        createdAt: ci.createdAt,
      })),
      stats: history.stats,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown check-in history error";
    console.error("[checkin-history] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "CHECKIN_ERROR",
          message: "Failed to fetch check-in history",
        },
      },
      { status: 500 }
    );
  }
}
