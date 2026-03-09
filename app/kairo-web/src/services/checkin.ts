/**
 * Check-in business logic — extracted from route handler.
 *
 * Pure data operations: no NextRequest/NextResponse, no HTTP concerns.
 * The route handler owns validation, auth, and response formatting.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculateStreak } from "@/lib/streak";

// ── Types ──

interface CheckInBasicFields {
  workout: boolean;
  meals: number;
  water: boolean;
  steps: boolean;
  note?: string | null;
}

type EnhancedField =
  | "avgWeight" | "waist" | "photoSubmitted" | "frontPhotoUrl"
  | "sidePhotoUrl" | "backPhotoUrl" | "workoutsCompleted" | "stepsAverage"
  | "calorieAdherence" | "proteinAdherence" | "sleepAverage"
  | "energyScore" | "hungerScore" | "stressScore" | "digestionScore"
  | "recoveryScore" | "painNotes" | "biggestWin" | "biggestStruggle"
  | "helpNeeded";

const ENHANCED_FIELDS: readonly EnhancedField[] = [
  "avgWeight", "waist", "photoSubmitted", "frontPhotoUrl",
  "sidePhotoUrl", "backPhotoUrl", "workoutsCompleted", "stepsAverage",
  "calorieAdherence", "proteinAdherence", "sleepAverage",
  "energyScore", "hungerScore", "stressScore", "digestionScore",
  "recoveryScore", "painNotes", "biggestWin", "biggestStruggle",
  "helpNeeded",
];

export type CreateCheckInResult =
  | { ok: true; checkIn: Awaited<ReturnType<typeof prisma.checkIn.create>> }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_CHECKED_IN" };

export interface CheckInHistoryResult {
  checkIns: Awaited<ReturnType<typeof prisma.checkIn.findMany>>;
  stats: { currentStreak: number; weeklyWorkouts: number; weeklyAdherence: number };
}

// ── Create ──

export async function createCheckIn(
  email: string,
  basicFields: CheckInBasicFields,
  enhancedData: Partial<Record<EnhancedField, unknown>>
): Promise<CreateCheckInResult> {
  const member = await prisma.member.findUnique({ where: { email } });
  if (!member || member.status !== "active") {
    return { ok: false, code: "NOT_FOUND" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.checkIn.findFirst({
    where: { memberId: member.id, date: today },
  });
  if (existing) {
    return { ok: false, code: "ALREADY_CHECKED_IN" };
  }

  const createData: Prisma.CheckInUncheckedCreateInput = {
    memberId: member.id,
    date: today,
    workout: basicFields.workout,
    meals: basicFields.meals,
    water: basicFields.water,
    steps: basicFields.steps,
    note: basicFields.note ?? null,
  };

  for (const field of ENHANCED_FIELDS) {
    if (enhancedData[field] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (createData as any)[field] = enhancedData[field];
    }
  }

  const checkIn = await prisma.checkIn.create({ data: createData });
  return { ok: true, checkIn };
}

// ── History + Stats ──

export async function getCheckInHistory(
  email: string,
  limit: number
): Promise<CheckInHistoryResult | null> {
  const member = await prisma.member.findUnique({ where: { email } });
  if (!member || member.status !== "active") return null;

  const checkIns = await prisma.checkIn.findMany({
    where: { memberId: member.id },
    orderBy: { date: "desc" },
    take: limit,
  });

  const currentStreak = calculateStreak(checkIns.map((ci) => ci.date));

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);

  const thisWeek = checkIns.filter((ci) => new Date(ci.date) >= weekStart);
  const weeklyWorkouts = thisWeek.filter((ci) => ci.workout).length;

  const daysElapsed = Math.min(
    Math.floor((now.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)) + 1,
    7
  );
  const weeklyAdherence = daysElapsed > 0
    ? Math.round((thisWeek.length / daysElapsed) * 100)
    : 0;

  return { checkIns, stats: { currentStreak, weeklyWorkouts, weeklyAdherence } };
}
