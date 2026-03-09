import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMemberOrCoachAuth } from "@/lib/auth";

/**
 * POST /api/onboarding
 *
 * Saves onboarding data for an active member.
 * Identified by email (Stripe is the identity provider — no auth in MVP).
 *
 * Supports both basic onboarding (Phase 4 fields) and extended intake
 * (Milestone K fields: body data, nutrition, lifestyle, commitment).
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - Only updates active members (prevents abuse on pending/canceled)
 * - No PII logged
 */

const VALID_MINUTES = [15, 20, 30, 45, 60] as const;

const OnboardingSchema = z.object({
  email: z.string().email("A valid email is required"),

  // Basic (Phase 4)
  goal: z.enum(["fat_loss", "muscle", "maintenance"]).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  minutesPerSession: z
    .number()
    .refine((v): v is (typeof VALID_MINUTES)[number] =>
      (VALID_MINUTES as readonly number[]).includes(v),
      { message: "Must be one of: 15, 20, 30, 45, 60" }
    )
    .optional(),
  injuries: z.string().max(500).optional(),

  // Extended intake (Milestone K)
  fullName: z.string().max(200).optional(),
  age: z.number().int().min(13).max(120).optional(),
  height: z.string().max(50).optional(),
  currentWeight: z.string().max(50).optional(),
  bodyFat: z.string().max(50).optional(),
  timezone: z.string().max(100).optional(),
  occupation: z.string().max(200).optional(),

  // Training details
  yearsTraining: z.number().int().min(0).max(50).optional(),
  currentSplit: z.string().max(200).optional(),
  favoriteLifts: z.string().max(500).optional(),
  weakBodyParts: z.string().max(500).optional(),
  equipmentAccess: z.enum(["none", "hotel", "dumbbells", "full_gym"]).optional(),
  sessionLength: z.number().int().min(10).max(180).optional(),

  // Nutrition details
  currentCalories: z.number().int().min(500).max(10000).optional(),
  proteinIntake: z.number().int().min(0).max(500).optional(),
  mealsPerDay: z.number().int().min(1).max(10).optional(),
  foodsEnjoy: z.string().max(500).optional(),
  foodsAvoid: z.string().max(500).optional(),
  appetiteLevel: z.enum(["low", "normal", "high"]).optional(),
  weekendEating: z.string().max(500).optional(),
  alcoholIntake: z.string().max(200).optional(),
  supplements: z.string().max(500).optional(),

  // Lifestyle / recovery
  avgSleep: z.number().min(0).max(24).optional(),
  stressLevel: z.enum(["low", "moderate", "high"]).optional(),
  stepCount: z.number().int().min(0).max(100000).optional(),
  jobActivityLevel: z.enum(["sedentary", "light", "moderate", "active"]).optional(),
  travelFrequency: z.string().max(200).optional(),

  // Commitment
  fallOffCause: z.string().max(1000).optional(),
  supportNeeded: z.string().max(1000).optional(),
  success90Days: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = OnboardingSchema.safeParse(body);

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

    const { email, ...fields } = parsed.data;

    // ── Auth: require session cookie (email match) or coach Bearer token ──
    const auth = await requireMemberOrCoachAuth(request, email);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // Only allow onboarding for active members
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

    // Build update data — null out missing optional fields from basic set,
    // only set extended fields if provided (don't null them out)
    const updateData: Record<string, unknown> = {
      goal: fields.goal ?? null,
      daysPerWeek: fields.daysPerWeek ?? null,
      minutesPerSession: fields.minutesPerSession ?? null,
      injuries: fields.injuries ?? null,
      onboardedAt: new Date(),
    };

    // Extended fields — only set if provided (don't overwrite existing data with null)
    const extendedFields = [
      "fullName", "age", "height", "currentWeight", "bodyFat",
      "timezone", "occupation", "yearsTraining", "currentSplit",
      "favoriteLifts", "weakBodyParts", "equipmentAccess", "sessionLength",
      "currentCalories", "proteinIntake", "mealsPerDay", "foodsEnjoy",
      "foodsAvoid", "appetiteLevel", "weekendEating", "alcoholIntake",
      "supplements", "avgSleep", "stressLevel", "stepCount",
      "jobActivityLevel", "travelFrequency", "fallOffCause",
      "supportNeeded", "success90Days",
    ] as const;

    for (const field of extendedFields) {
      if (fields[field] !== undefined) {
        updateData[field] = fields[field];
      }
    }

    // Update member with onboarding data
    await prisma.member.update({
      where: { email },
      data: updateData,
    });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown onboarding error";
    console.error("[onboarding] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "ONBOARDING_ERROR",
          message: "Failed to save onboarding data",
        },
      },
      { status: 500 }
    );
  }
}
