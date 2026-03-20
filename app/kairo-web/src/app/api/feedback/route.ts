import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireMemberOrCoachAuth } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";

/**
 * POST /api/feedback
 *
 * Member-submitted feedback from the More page.
 * Handles two types:
 *   - "review"     — star rating (1-5) + optional comment
 *   - "suggestion" — category + text
 *
 * Auth: member session cookie (email must match authenticated session).
 * Rate limit: 5 requests per 60s per IP.
 *
 * Security:
 * - Zod input validation
 * - Member auth required
 * - No PII logged
 */

const feedbackLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

const FeedbackSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("review"),
    email: z.string().email(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(2000).optional(),
  }),
  z.object({
    type: z.literal("suggestion"),
    email: z.string().email(),
    category: z.enum(["Workouts", "Nutrition", "App Experience", "Other"]),
    comment: z.string().min(1).max(2000),
  }),
]);

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = feedbackLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "RATE_LIMIT_EXCEEDED", message: "Too many requests. Please try again later." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { code: "INVALID_JSON", message: "Invalid request body." } }, { status: 400 });
  }

  const parsed = FeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid feedback data.", details: parsed.error.flatten().fieldErrors } },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  const auth = await requireMemberOrCoachAuth(request, email);
  if (!auth.authorized) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required." } }, { status: 401 });
  }

  const member = await prisma.member.findUnique({ where: { email }, select: { id: true } });
  if (!member) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Member not found." } }, { status: 404 });
  }

  await prisma.memberFeedback.create({
    data: {
      memberId: member.id,
      type: parsed.data.type,
      rating: parsed.data.type === "review" ? parsed.data.rating : null,
      comment: parsed.data.comment ?? null,
      category: parsed.data.type === "suggestion" ? parsed.data.category : null,
    },
  });

  return NextResponse.json({ success: true });
}
