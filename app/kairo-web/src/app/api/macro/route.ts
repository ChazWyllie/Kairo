import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * Macro API — manage nutrition/macro targets for members.
 *
 * POST   /api/macro?secret=  — create a macro target (coach only)
 * GET    /api/macro?email=   — get macro targets for a member
 * PATCH  /api/macro?secret=  — update a macro target (coach only)
 *
 * Security:
 * - POST/PATCH require COACH_SECRET
 * - Zod validation on all inputs
 * - No PII logged
 */

const CreateMacroSchema = z.object({
  email: z.string().email("A valid member email is required"),
  effectiveDate: z.string().datetime(),
  calories: z.number().int().min(800).max(10000),
  protein: z.number().int().min(20).max(500),
  fatsMin: z.number().int().min(0).max(300).optional(),
  carbs: z.number().int().min(0).max(1500).optional(),
  stepsTarget: z.number().int().min(0).max(100000).optional(),
  hydrationTarget: z.string().max(50).optional(),
  adjustmentReason: z.string().max(2000).optional(),
});

const PatchMacroSchema = z.object({
  macroId: z.string().min(1, "Macro target ID is required"),
  status: z.enum(["active", "previous"]).optional(),
  calories: z.number().int().min(800).max(10000).optional(),
  protein: z.number().int().min(20).max(500).optional(),
  fatsMin: z.number().int().min(0).max(300).optional(),
  carbs: z.number().int().min(0).max(1500).optional(),
  stepsTarget: z.number().int().min(0).max(100000).optional(),
  hydrationTarget: z.string().max(50).optional(),
  adjustmentReason: z.string().max(2000).optional(),
});

// ── Auth helper ──
function checkCoachAuth(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get("secret");
  return !!secret && secret === env.COACH_SECRET;
}

// ── POST — Create a macro target ──

export async function POST(request: NextRequest) {
  if (!checkCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CreateMacroSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid macro data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, ...fields } = parsed.data;

    // Resolve member by email
    const member = await prisma.member.findUnique({ where: { email } });
    if (!member) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No member found for this email" } },
        { status: 404 }
      );
    }

    // Deactivate any current active macro target for this member
    await prisma.macroTarget.updateMany({
      where: { memberId: member.id, status: "active" },
      data: { status: "previous" },
    });

    const macro = await prisma.macroTarget.create({
      data: {
        memberId: member.id,
        status: "active",
        effectiveDate: new Date(fields.effectiveDate),
        calories: fields.calories,
        protein: fields.protein,
        fatsMin: fields.fatsMin ?? null,
        carbs: fields.carbs ?? null,
        stepsTarget: fields.stepsTarget ?? null,
        hydrationTarget: fields.hydrationTarget ?? null,
        adjustmentReason: fields.adjustmentReason ?? null,
        previousCalories: null,
        previousProtein: null,
      },
    });

    console.log("[macro] Created:", { id: macro.id });

    return NextResponse.json(
      {
        macro: {
          id: macro.id,
          status: macro.status,
          effectiveDate: macro.effectiveDate,
          calories: macro.calories,
          protein: macro.protein,
          fatsMin: macro.fatsMin,
          carbs: macro.carbs,
          stepsTarget: macro.stepsTarget,
          hydrationTarget: macro.hydrationTarget,
          adjustmentReason: macro.adjustmentReason,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[macro] Error:", message);

    return NextResponse.json(
      { error: { code: "MACRO_ERROR", message: "Failed to create macro target" } },
      { status: 500 }
    );
  }
}

// ── GET — Get macro targets for a member ──

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Email query parameter is required" } },
      { status: 400 }
    );
  }

  try {
    const member = await prisma.member.findUnique({ where: { email } });
    if (!member) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No member found for this email" } },
        { status: 404 }
      );
    }

    const macros = await prisma.macroTarget.findMany({
      where: { memberId: member.id },
      orderBy: { effectiveDate: "desc" },
      take: 50,
    });

    return NextResponse.json({
      macros: macros.map((m) => ({
        id: m.id,
        status: m.status,
        effectiveDate: m.effectiveDate,
        calories: m.calories,
        protein: m.protein,
        fatsMin: m.fatsMin,
        carbs: m.carbs,
        stepsTarget: m.stepsTarget,
        hydrationTarget: m.hydrationTarget,
        adjustmentReason: m.adjustmentReason,
        previousCalories: m.previousCalories,
        previousProtein: m.previousProtein,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[macro] GET error:", message);

    return NextResponse.json(
      { error: { code: "MACRO_ERROR", message: "Failed to fetch macro targets" } },
      { status: 500 }
    );
  }
}

// ── PATCH — Update a macro target ──

export async function PATCH(request: NextRequest) {
  if (!checkCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = PatchMacroSchema.safeParse(body);

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

    const { macroId, ...fields } = parsed.data;

    const existing = await prisma.macroTarget.findUnique({ where: { id: macroId } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Macro target not found" } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (fields.status !== undefined) updateData.status = fields.status;
    if (fields.calories !== undefined) {
      updateData.previousCalories = existing.calories;
      updateData.calories = fields.calories;
    }
    if (fields.protein !== undefined) {
      updateData.previousProtein = existing.protein;
      updateData.protein = fields.protein;
    }
    if (fields.fatsMin !== undefined) updateData.fatsMin = fields.fatsMin;
    if (fields.carbs !== undefined) updateData.carbs = fields.carbs;
    if (fields.stepsTarget !== undefined) updateData.stepsTarget = fields.stepsTarget;
    if (fields.hydrationTarget !== undefined) updateData.hydrationTarget = fields.hydrationTarget;
    if (fields.adjustmentReason !== undefined)
      updateData.adjustmentReason = fields.adjustmentReason;

    await prisma.macroTarget.update({ where: { id: macroId }, data: updateData });

    console.log("[macro] Updated:", { id: macroId });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[macro] PATCH error:", message);

    return NextResponse.json(
      { error: { code: "MACRO_ERROR", message: "Failed to update macro target" } },
      { status: 500 }
    );
  }
}
