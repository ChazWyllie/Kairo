import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { waitlistLimiter } from "@/lib/rate-limit";

/**
 * POST /api/waitlist
 *
 * Waitlist lead capture endpoint.
 * 1. Rate limits by IP
 * 2. Validates email via Zod
 * 3. Upserts a Lead record with source "waitlist" (idempotent on email)
 * 4. Returns success confirmation
 *
 * Security:
 * - Zod input validation — no raw req.body access
 * - Rate limiting per IP (5 req/60s)
 * - No PII in error responses
 * - Extra fields stripped by Zod (no mass assignment)
 */

const WaitlistSchema = z.object({
  email: z
    .string()
    .transform((e) => e.trim().toLowerCase())
    .pipe(z.string().email("A valid email is required")),
});

export async function POST(request: NextRequest) {
  // 1. Rate limit
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = waitlistLimiter.check(ip);

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
  let parsed: z.infer<typeof WaitlistSchema>;
  try {
    const body = await request.json();
    parsed = WaitlistSchema.parse(body);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid email address is required.",
          },
        },
        { status: 400 }
      );
    }
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

  // 3. Upsert lead (idempotent on email)
  try {
    await prisma.lead.upsert({
      where: { email: parsed.email },
      create: {
        email: parsed.email,
        source: "waitlist",
      },
      update: {
        // Touch updatedAt on re-submission — no data overwrite
      },
    });

    return NextResponse.json({
      success: true,
      message: "You're on the list!",
    });
  } catch (err) {
    console.error(
      "[waitlist] Error:",
      err instanceof Error ? err.message : "Unknown error"
    );
    return NextResponse.json(
      {
        error: {
          code: "WAITLIST_ERROR",
          message: "Unable to join waitlist. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
