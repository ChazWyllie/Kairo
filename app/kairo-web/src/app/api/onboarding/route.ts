import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/onboarding
 *
 * Saves onboarding data for an active member.
 * Identified by email (Stripe is the identity provider — no auth in MVP).
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - Only updates active members (prevents abuse on pending/canceled)
 * - No PII logged
 */

const VALID_MINUTES = [15, 20, 30, 45, 60] as const;

const OnboardingSchema = z.object({
  email: z.string().email("A valid email is required"),
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

    const { email, goal, daysPerWeek, minutesPerSession, injuries } =
      parsed.data;

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

    // Update member with onboarding data
    await prisma.member.update({
      where: { email },
      data: {
        goal: goal ?? null,
        daysPerWeek: daysPerWeek ?? null,
        minutesPerSession: minutesPerSession ?? null,
        injuries: injuries ?? null,
        onboardedAt: new Date(),
      },
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
