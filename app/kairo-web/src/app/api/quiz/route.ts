import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { quizLimiter } from "@/lib/rate-limit";
import { recommendTier, type QuizAnswers } from "@/lib/quiz-engine";
import { sendQuizWelcomeEmail } from "@/services/email";

/**
 * POST /api/quiz
 *
 * Quiz submission + lead capture endpoint.
 * 1. Validates input via Zod
 * 2. Runs quiz engine to recommend a tier
 * 3. Upserts a Lead record (idempotent on email)
 * 4. Sends welcome email (fire-and-forget)
 * 5. Returns recommended tier + lead ID
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - Rate limiting per IP
 * - No PII in error responses
 * - Email is fire-and-forget (non-blocking)
 */

const QuizAnswersSchema = z
  .object({
    goal: z
      .enum(["fat_loss", "muscle", "maintenance"])
      .optional(),
    experience: z
      .enum(["beginner", "intermediate", "advanced"])
      .optional(),
    daysPerWeek: z.number().int().min(1).max(7).optional(),
    minutesPerSession: z.number().int().min(1).optional(),
    challenge: z
      .enum(["time", "consistency", "accountability", "plateau"])
      .optional(),
  })
  .optional()
  .default({});

const QuizSubmissionSchema = z.object({
  email: z.string().email("A valid email is required"),
  answers: QuizAnswersSchema,
});

export async function POST(request: NextRequest) {
  // 1. Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = quizLimiter.check(ip);

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
  let parsed: z.infer<typeof QuizSubmissionSchema>;
  try {
    const body = await request.json();
    parsed = QuizSubmissionSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid quiz submission",
          },
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
        },
      },
      { status: 400 }
    );
  }

  // 3. Run recommendation engine
  const answers: QuizAnswers = parsed.answers ?? {};
  const recommendedTier = recommendTier(answers);

  // 4. Upsert lead (idempotent on email)
  try {
    const lead = await prisma.lead.upsert({
      where: { email: parsed.email },
      create: {
        email: parsed.email,
        quizAnswers: answers as unknown as Prisma.InputJsonValue,
        recommendedTier,
        source: "quiz",
      },
      update: {
        quizAnswers: answers as unknown as Prisma.InputJsonValue,
        recommendedTier,
      },
    });

    // 5. Send welcome email (fire-and-forget — don't fail the response)
    try {
      await sendQuizWelcomeEmail({
        email: parsed.email,
        recommendedTier,
      });
    } catch {
      console.error("[quiz] Welcome email failed (non-fatal)");
    }

    return NextResponse.json({
      recommendedTier,
      leadId: lead.id,
    });
  } catch (err) {
    console.error("[quiz] Error:", err instanceof Error ? err.message : "Unknown error");
    return NextResponse.json(
      {
        error: {
          code: "QUIZ_ERROR",
          message: "Unable to process quiz submission",
        },
      },
      { status: 500 }
    );
  }
}
