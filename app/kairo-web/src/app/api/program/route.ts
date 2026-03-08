import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

/**
 * Program API — manage training program blocks for members.
 *
 * POST   /api/program?secret=  — create a program block (coach only)
 * GET    /api/program?email=   — get program blocks for a member
 * PATCH  /api/program?secret=  — update a program block (coach only)
 *
 * Security:
 * - POST/PATCH require COACH_SECRET
 * - Zod validation on all inputs
 * - No PII logged
 */

const GOALS = ["hypertrophy", "strength", "fat_loss", "maintenance"] as const;
const STATUSES = ["active", "completed", "upcoming"] as const;

const CreateProgramSchema = z.object({
  email: z.string().email("A valid member email is required"),
  name: z.string().min(1).max(200),
  status: z.enum(STATUSES).default("active"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),

  // Programming details
  primaryGoal: z.enum(GOALS).optional(),
  split: z.string().max(100).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  progressionModel: z.string().max(200).optional(),
  deloadPlanned: z.boolean().default(false),
  deloadWeek: z.number().int().min(1).max(12).optional(),

  // Content
  keyExercises: z.string().max(2000).optional(),
  workoutNotes: z.string().max(10000).optional(),
  cardioTarget: z.string().max(500).optional(),
  stepsTarget: z.number().int().min(0).max(100000).optional(),

  // Adjustments
  nextUpdateDate: z.string().datetime().optional(),
});

const PatchProgramSchema = z.object({
  programId: z.string().min(1, "Program ID is required"),
  name: z.string().min(1).max(200).optional(),
  status: z.enum(STATUSES).optional(),
  endDate: z.string().datetime().optional(),
  primaryGoal: z.enum(GOALS).optional(),
  split: z.string().max(100).optional(),
  daysPerWeek: z.number().int().min(1).max(7).optional(),
  progressionModel: z.string().max(200).optional(),
  deloadPlanned: z.boolean().optional(),
  deloadWeek: z.number().int().min(1).max(12).optional(),
  keyExercises: z.string().max(2000).optional(),
  workoutNotes: z.string().max(10000).optional(),
  cardioTarget: z.string().max(500).optional(),
  stepsTarget: z.number().int().min(0).max(100000).optional(),
  adjustmentsMade: z.string().max(5000).optional(),
  adjustmentReason: z.string().max(5000).optional(),
  nextUpdateDate: z.string().datetime().optional(),
});

// ── Auth helper ──
function checkCoachAuth(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get("secret");
  return !!secret && secret === env.COACH_SECRET;
}

// ── POST — Create a program block ──

export async function POST(request: NextRequest) {
  if (!checkCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = CreateProgramSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid program data",
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

    const program = await prisma.programBlock.create({
      data: {
        memberId: member.id,
        name: fields.name,
        status: fields.status,
        startDate: new Date(fields.startDate),
        endDate: fields.endDate ? new Date(fields.endDate) : null,
        primaryGoal: fields.primaryGoal ?? null,
        split: fields.split ?? null,
        daysPerWeek: fields.daysPerWeek ?? null,
        progressionModel: fields.progressionModel ?? null,
        deloadPlanned: fields.deloadPlanned,
        deloadWeek: fields.deloadWeek ?? null,
        keyExercises: fields.keyExercises ?? null,
        workoutNotes: fields.workoutNotes ?? null,
        cardioTarget: fields.cardioTarget ?? null,
        stepsTarget: fields.stepsTarget ?? null,
        nextUpdateDate: fields.nextUpdateDate ? new Date(fields.nextUpdateDate) : null,
      },
    });

    console.log("[program] Created:", { id: program.id, name: program.name });

    return NextResponse.json(
      {
        program: {
          id: program.id,
          name: program.name,
          status: program.status,
          startDate: program.startDate,
          endDate: program.endDate,
          primaryGoal: program.primaryGoal,
          split: program.split,
          daysPerWeek: program.daysPerWeek,
          progressionModel: program.progressionModel,
          deloadPlanned: program.deloadPlanned,
          deloadWeek: program.deloadWeek,
          keyExercises: program.keyExercises,
          workoutNotes: program.workoutNotes,
          cardioTarget: program.cardioTarget,
          stepsTarget: program.stepsTarget,
          nextUpdateDate: program.nextUpdateDate,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[program] Error:", message);

    return NextResponse.json(
      { error: { code: "PROGRAM_ERROR", message: "Failed to create program" } },
      { status: 500 }
    );
  }
}

// ── GET — Get program blocks for a member ──

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

    const programs = await prisma.programBlock.findMany({
      where: { memberId: member.id },
      orderBy: { startDate: "desc" },
      take: 50,
    });

    return NextResponse.json({
      programs: programs.map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        primaryGoal: p.primaryGoal,
        split: p.split,
        daysPerWeek: p.daysPerWeek,
        progressionModel: p.progressionModel,
        deloadPlanned: p.deloadPlanned,
        deloadWeek: p.deloadWeek,
        keyExercises: p.keyExercises,
        workoutNotes: p.workoutNotes,
        cardioTarget: p.cardioTarget,
        stepsTarget: p.stepsTarget,
        adjustmentsMade: p.adjustmentsMade,
        adjustmentReason: p.adjustmentReason,
        nextUpdateDate: p.nextUpdateDate,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[program] GET error:", message);

    return NextResponse.json(
      { error: { code: "PROGRAM_ERROR", message: "Failed to fetch programs" } },
      { status: 500 }
    );
  }
}

// ── PATCH — Update a program block ──

export async function PATCH(request: NextRequest) {
  if (!checkCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid coach secret" } },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = PatchProgramSchema.safeParse(body);

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

    const { programId, ...fields } = parsed.data;

    const existing = await prisma.programBlock.findUnique({ where: { id: programId } });
    if (!existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Program block not found" } },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.status !== undefined) updateData.status = fields.status;
    if (fields.endDate !== undefined) updateData.endDate = new Date(fields.endDate);
    if (fields.primaryGoal !== undefined) updateData.primaryGoal = fields.primaryGoal;
    if (fields.split !== undefined) updateData.split = fields.split;
    if (fields.daysPerWeek !== undefined) updateData.daysPerWeek = fields.daysPerWeek;
    if (fields.progressionModel !== undefined)
      updateData.progressionModel = fields.progressionModel;
    if (fields.deloadPlanned !== undefined) updateData.deloadPlanned = fields.deloadPlanned;
    if (fields.deloadWeek !== undefined) updateData.deloadWeek = fields.deloadWeek;
    if (fields.keyExercises !== undefined) updateData.keyExercises = fields.keyExercises;
    if (fields.workoutNotes !== undefined) updateData.workoutNotes = fields.workoutNotes;
    if (fields.cardioTarget !== undefined) updateData.cardioTarget = fields.cardioTarget;
    if (fields.stepsTarget !== undefined) updateData.stepsTarget = fields.stepsTarget;
    if (fields.adjustmentsMade !== undefined) updateData.adjustmentsMade = fields.adjustmentsMade;
    if (fields.adjustmentReason !== undefined)
      updateData.adjustmentReason = fields.adjustmentReason;
    if (fields.nextUpdateDate !== undefined)
      updateData.nextUpdateDate = new Date(fields.nextUpdateDate);

    await prisma.programBlock.update({ where: { id: programId }, data: updateData });

    console.log("[program] Updated:", { id: programId });

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[program] PATCH error:", message);

    return NextResponse.json(
      { error: { code: "PROGRAM_ERROR", message: "Failed to update program" } },
      { status: 500 }
    );
  }
}
