import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

    const { email, workout, meals, water, steps, note } = parsed.data;

    // Only allow check-ins for active members
    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member || member.status !== "active") {
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

    // Check for existing check-in today (one per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.checkIn.findFirst({
      where: {
        memberId: member.id,
        date: today,
      },
    });

    if (existing) {
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

    // Build create data — basic fields always set, enhanced only if provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: any = {
      memberId: member.id,
      date: today,
      workout,
      meals,
      water,
      steps,
      note: note ?? null,
    };

    // Enhanced fields — only set if provided
    const enhancedFields = [
      "avgWeight", "waist", "photoSubmitted", "frontPhotoUrl",
      "sidePhotoUrl", "backPhotoUrl", "workoutsCompleted", "stepsAverage",
      "calorieAdherence", "proteinAdherence", "sleepAverage",
      "energyScore", "hungerScore", "stressScore", "digestionScore",
      "recoveryScore", "painNotes", "biggestWin", "biggestStruggle",
      "helpNeeded",
    ] as const;

    for (const field of enhancedFields) {
      if (parsed.data[field] !== undefined) {
        createData[field] = parsed.data[field];
      }
    }

    const checkIn = await prisma.checkIn.create({ data: createData });

    return NextResponse.json(
      {
        checkIn: {
          id: checkIn.id,
          date: checkIn.date,
          workout: checkIn.workout,
          meals: checkIn.meals,
          water: checkIn.water,
          steps: checkIn.steps,
          note: checkIn.note,
          avgWeight: checkIn.avgWeight,
          waist: checkIn.waist,
          photoSubmitted: checkIn.photoSubmitted,
          workoutsCompleted: checkIn.workoutsCompleted,
          stepsAverage: checkIn.stepsAverage,
          calorieAdherence: checkIn.calorieAdherence,
          proteinAdherence: checkIn.proteinAdherence,
          sleepAverage: checkIn.sleepAverage,
          energyScore: checkIn.energyScore,
          hungerScore: checkIn.hungerScore,
          stressScore: checkIn.stressScore,
          digestionScore: checkIn.digestionScore,
          recoveryScore: checkIn.recoveryScore,
          painNotes: checkIn.painNotes,
          biggestWin: checkIn.biggestWin,
          biggestStruggle: checkIn.biggestStruggle,
          helpNeeded: checkIn.helpNeeded,
          coachStatus: checkIn.coachStatus,
          coachResponse: checkIn.coachResponse,
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

    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 30, 1), 90) : 30;

    // Only allow history for active members
    const member = await prisma.member.findUnique({
      where: { email },
    });

    if (!member || member.status !== "active") {
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

    // Fetch recent check-ins
    const checkIns = await prisma.checkIn.findMany({
      where: { memberId: member.id },
      orderBy: { date: "desc" },
      take: limit,
    });

    // Calculate stats
    const currentStreak = calculateStreak(checkIns.map((ci) => ci.date));
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);

    const thisWeek = checkIns.filter((ci) => new Date(ci.date) >= weekStart);
    const weeklyWorkouts = thisWeek.filter((ci) => ci.workout).length;

    // Weekly adherence: days checked in / days elapsed this week (max 7)
    const daysElapsed = Math.min(
      Math.floor((now.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)) + 1,
      7
    );
    const weeklyAdherence = daysElapsed > 0
      ? Math.round((thisWeek.length / daysElapsed) * 100)
      : 0;

    return NextResponse.json({
      checkIns: checkIns.map((ci) => ({
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
      stats: {
        currentStreak,
        weeklyWorkouts,
        weeklyAdherence,
      },
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

/**
 * Calculate current streak — consecutive days with a check-in,
 * starting from today (or yesterday if no check-in today yet).
 */
function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalized = dates.map((d) => {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd.getTime();
  });

  const unique = [...new Set(normalized)].sort((a, b) => b - a);
  const oneDay = 24 * 60 * 60 * 1000;
  let streak = 0;

  let cursor = today.getTime();
  if (unique[0] !== cursor) {
    cursor = cursor - oneDay;
    if (unique[0] !== cursor) return 0;
  }

  for (const dateMs of unique) {
    if (dateMs === cursor) {
      streak++;
      cursor -= oneDay;
    } else if (dateMs < cursor) {
      break;
    }
  }

  return streak;
}
