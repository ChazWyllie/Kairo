import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCoachAuth } from "@/lib/auth";

/**
 * PATCH /api/checkin/respond (Authorization: Bearer COACH_SECRET)
 *
 * Coach responds to a check-in — sets triage status (green/yellow/red)
 * and writes a coach response. Used from the coach dashboard.
 *
 * Security:
 * - COACH_SECRET required
 * - Zod validation
 * - No PII logged
 */

const RespondSchema = z.object({
  checkInId: z.string().min(1, "Check-in ID is required"),
  coachStatus: z.enum(["green", "yellow", "red"]),
  coachResponse: z.string().max(5000).optional(),
});

export async function PATCH(request: NextRequest) {
  // ── Auth: Authorization header with constant-time comparison ──
  if (!requireCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = RespondSchema.safeParse(body);

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

    const { checkInId, coachStatus, coachResponse } = parsed.data;

    const existing = await prisma.checkIn.findUnique({
      where: { id: checkInId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Check-in not found" } },
        { status: 404 }
      );
    }

    await prisma.checkIn.update({
      where: { id: checkInId },
      data: {
        coachStatus,
        coachResponse: coachResponse ?? null,
        responseAt: new Date(),
      },
    });

    console.log("[checkin-respond] Triaged:", { checkInId, coachStatus });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown respond error";
    console.error("[checkin-respond] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "RESPOND_ERROR",
          message: "Failed to respond to check-in",
        },
      },
      { status: 500 }
    );
  }
}
