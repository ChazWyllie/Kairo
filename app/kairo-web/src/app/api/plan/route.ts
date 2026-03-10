import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { requireMemberOrCoachAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planLimiter } from "@/lib/rate-limit";
import { generatePlan } from "@/lib/plan-generator";
import type { NormalizedConstraints } from "@/lib/constraints";

/**
 * POST /api/plan
 *
 * Generates a daily workout + nutrition plan for a member.
 * 1. Rate limits by IP
 * 2. Validates input via Zod
 * 3. Authenticates member (session cookie or coach bearer)
 * 4. Verifies member exists and is active
 * 5. Generates plan from constraints
 * 6. Upserts DailyPlan record (one per member per day)
 * 7. Returns the generated plan
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - Rate limiting per IP (10 req/60s)
 * - Auth required (member session or coach bearer)
 * - Only active members can generate plans
 * - No PII in error responses
 * - Extra fields stripped by Zod
 */

const VALID_TIMES = [15, 20, 30, 45, 60] as const;
const VALID_EQUIPMENT = ["none", "hotel", "dumbbells", "full_gym"] as const;
const VALID_GOALS = ["fat_loss", "muscle", "maintenance"] as const;
const VALID_EXPERIENCE = ["beginner", "intermediate"] as const;

const PlanRequestSchema = z.object({
  email: z.string().email("A valid email is required"),
  timeAvailable: z.number().refine(
    (v): v is (typeof VALID_TIMES)[number] =>
      (VALID_TIMES as readonly number[]).includes(v),
    { message: `Must be one of: ${VALID_TIMES.join(", ")}` }
  ),
  equipment: z.enum(VALID_EQUIPMENT),
  goal: z.enum(VALID_GOALS),
  experience: z.enum(VALID_EXPERIENCE).default("beginner"),
  travelMode: z.boolean().default(false),
  highStress: z.boolean().default(false),
  lowSleep: z.boolean().default(false),
  injuryLimitation: z.string().max(200).optional(),
  noJumping: z.boolean().default(false),
});

function toNormalizedConstraints(
  parsed: z.infer<typeof PlanRequestSchema>
): NormalizedConstraints {
  return {
    timeAvailable: parsed.timeAvailable as NormalizedConstraints["timeAvailable"],
    equipment: parsed.equipment,
    context: {
      travelMode: parsed.travelMode,
      highStress: parsed.highStress,
      lowSleep: parsed.lowSleep,
    },
    preferences: {
      goal: parsed.goal,
      experience: parsed.experience,
    },
    optional: {
      injuryLimitation: parsed.injuryLimitation ?? null,
      noJumping: parsed.noJumping,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const limit = planLimiter.check(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfter) },
        }
      );
    }

    // 2. Parse and validate input
    const body = await request.json().catch(() => null);
    if (body === null) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body.",
          },
        },
        { status: 400 }
      );
    }

    const parsed = PlanRequestSchema.safeParse(body);
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

    const { email } = parsed.data;

    // 3. Auth: require session cookie (email match) or coach Bearer token
    const auth = await requireMemberOrCoachAuth(request, email);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // 4. Verify member exists and is active
    const member = await prisma.member.findUnique({
      where: { email },
      select: { id: true, status: true },
    });

    if (!member) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No membership found for this email",
          },
        },
        { status: 404 }
      );
    }

    if (member.status !== "active") {
      return NextResponse.json(
        {
          error: {
            code: "INACTIVE_MEMBER",
            message: "Active membership required to generate a plan",
          },
        },
        { status: 403 }
      );
    }

    // 5. Generate plan from validated constraints
    const constraints = toNormalizedConstraints(parsed.data);
    const plan = generatePlan(constraints);

    // 6. Upsert DailyPlan record (one per member per day)
    const today = new Date(plan.date);
    await prisma.dailyPlan.upsert({
      where: {
        memberId_date: {
          memberId: member.id,
          date: today,
        },
      },
      create: {
        memberId: member.id,
        date: today,
        mode: plan.mode,
        plan: JSON.parse(JSON.stringify(plan)) as Prisma.InputJsonValue,
        constraints: JSON.parse(JSON.stringify(constraints)) as Prisma.InputJsonValue,
      },
      update: {
        mode: plan.mode,
        plan: JSON.parse(JSON.stringify(plan)) as Prisma.InputJsonValue,
        constraints: JSON.parse(JSON.stringify(constraints)) as Prisma.InputJsonValue,
      },
    });

    // 7. Return the generated plan
    return NextResponse.json({ plan });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown plan error";
    console.error("[plan] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "PLAN_ERROR",
          message: "Failed to generate plan",
        },
      },
      { status: 500 }
    );
  }
}
