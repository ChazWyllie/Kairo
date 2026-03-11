import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCoachAuth } from "@/lib/auth";
import { isValidEmail } from "@/lib/validation";
import {
  submitApplication,
  getApplicationByEmail,
  updateApplicationStatus,
} from "@/services/application";

/**
 * Application API — lead qualification before payment.
 *
 * POST  /api/application          — submit an application (public)
 * GET   /api/application?email=   — check application status (public)
 * PATCH /api/application  — approve/reject (Authorization: Bearer COACH_SECRET)
 *
 * Security:
 * - Zod validation on all inputs
 * - PATCH requires COACH_SECRET
 * - No PII logged
 */

const ApplicationSchema = z.object({
  email: z.string().email("A valid email is required"),
  fullName: z.string().min(1, "Full name is required").max(200),
  phone: z.string().max(30).optional(),
  age: z.number().int().min(13).max(120).optional(),
  height: z.string().max(50).optional(),
  currentWeight: z.string().max(50).optional(),
  goal: z.enum(["fat_loss", "muscle", "maintenance"]),
  whyNow: z.string().max(1000).optional(),
  trainingExperience: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional(),
  trainingFrequency: z.string().max(200).optional(),
  gymAccess: z.enum(["none", "hotel", "dumbbells", "full_gym"]).optional(),
  injuryHistory: z.string().max(1000).optional(),
  nutritionStruggles: z.string().max(1000).optional(),
  biggestObstacle: z.string().max(1000).optional(),
  helpWithMost: z.string().max(1000).optional(),
  preferredTier: z
    .enum(["foundation", "coaching", "performance", "vip"])
    .optional(),
  readyForStructure: z.boolean().optional(),
  budgetComfort: z.string().max(200).optional(),
});

const PatchSchema = z.object({
  email: z.string().email("A valid email is required"),
  status: z.enum(["approved", "rejected"]),
});

// ── POST — Submit application ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = ApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid application data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const result = await submitApplication(parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: {
            code: "DUPLICATE",
            message: "An application with this email already exists",
          },
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { status: "ok", applicationId: result.applicationId },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown application error";
    console.error("[application] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "APPLICATION_ERROR",
          message: "Failed to submit application",
        },
      },
      { status: 500 }
    );
  }
}

// ── GET — Check application status ──

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

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

  const application = await getApplicationByEmail(email);

  if (!application) {
    return NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "No application found for this email",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ application });
}

// ── PATCH — Approve or reject application (coach only) ──

export async function PATCH(request: NextRequest) {
  // ── Auth: Authorization header with constant-time comparison ──
  if (!requireCoachAuth(request)) {
    return NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid coach secret",
        },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = PatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, status } = parsed.data;
    const result = await updateApplicationStatus(email, status);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No application found for this email",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    console.error("[application] Patch error:", message);

    return NextResponse.json(
      {
        error: {
          code: "APPLICATION_ERROR",
          message: "Failed to update application",
        },
      },
      { status: 500 }
    );
  }
}
