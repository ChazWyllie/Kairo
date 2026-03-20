import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  createSessionToken,
  getSessionCookieConfig,
  getCoachSessionCookieConfig,
} from "@/lib/auth";
import { loginLimiter } from "@/lib/rate-limit";

/**
 * POST /api/auth/login
 *
 * Authenticate a member with email + password.
 * Also silently handles coach auth — if password matches COACH_SECRET,
 * returns role: "coach" (no visible UI difference, no separate endpoint).
 *
 * Security:
 * - bcrypt verify for members (constant-time comparison)
 * - Constant-time comparison for coach secret
 * - Generic error message (don't reveal if email exists or if coach path exists)
 * - Never log passwords
 */

const LoginSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid login data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // ── Rate limiting ──
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateLimitKey = `${ip}:${email}`;
    const rateCheck = loginLimiter.check(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many login attempts. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      );
    }

    // ── Coach auth (hidden path) ──
    // Always perform constant-time comparison regardless of password length.
    // No length check — that would leak secret length via timing.
    const coachSecret = env.COACH_SECRET;
    if (coachSecret) {
      const { timingSafeEqual } = await import("crypto");
      const maxLen = Math.max(
        Buffer.byteLength(password),
        Buffer.byteLength(coachSecret)
      );
      const bufA = Buffer.alloc(maxLen);
      const bufB = Buffer.alloc(maxLen);
      Buffer.from(password).copy(bufA);
      Buffer.from(coachSecret).copy(bufB);
      const match =
        timingSafeEqual(bufA, bufB) &&
        Buffer.byteLength(password) === Buffer.byteLength(coachSecret);
      if (match) {
        const token = await createSessionToken(email);
        console.log("[auth/login] Coach authenticated");
        const response = NextResponse.json({
          status: "ok",
          role: "coach",
        });
        // Set both session JWT cookie and coach_session httpOnly cookie.
        // The coach_session cookie carries the validated secret so the
        // browser flow never needs to pass it via URL or client-side JS.
        response.headers.append("Set-Cookie", getSessionCookieConfig(token));
        response.headers.append("Set-Cookie", getCoachSessionCookieConfig(coachSecret));
        return response;
      }
    }

    // ── Member auth ──
    const member = await prisma.member.findUnique({
      where: { email },
      select: { passwordHash: true, status: true, deletedAt: true },
    });

    // Generic error — don't reveal if account exists or has been deleted
    if (!member || !member.passwordHash || member.deletedAt) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(password, member.passwordHash);

    if (!valid) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    const token = await createSessionToken(email);

    console.log("[auth/login] Member authenticated");

    const response = NextResponse.json({
      status: "ok",
      role: "member",
      memberStatus: member.status,
    });
    response.headers.set("Set-Cookie", getSessionCookieConfig(token));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[auth/login] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "LOGIN_ERROR",
          message: "Failed to log in",
        },
      },
      { status: 500 }
    );
  }
}
