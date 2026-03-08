import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  createSessionToken,
  getSessionCookieConfig,
} from "@/lib/auth";

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

    // ── Coach auth (hidden path) ──
    // If password matches COACH_SECRET, authenticate as coach.
    // Uses constant-time comparison to prevent timing attacks.
    const coachSecret = env.COACH_SECRET;
    if (coachSecret && password.length === coachSecret.length) {
      const encoder = new TextEncoder();
      const a = encoder.encode(password);
      const b = encoder.encode(coachSecret);
      let mismatch = 0;
      for (let i = 0; i < a.length; i++) {
        mismatch |= a[i] ^ b[i];
      }
      if (mismatch === 0) {
        const token = await createSessionToken(email);
        console.log("[auth/login] Coach authenticated");
        const response = NextResponse.json({
          status: "ok",
          role: "coach",
        });
        response.headers.set("Set-Cookie", getSessionCookieConfig(token));
        return response;
      }
    }

    // ── Member auth ──
    const member = await prisma.member.findUnique({
      where: { email },
      select: { passwordHash: true, status: true },
    });

    // Generic error — don't reveal if account exists
    if (!member || !member.passwordHash) {
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
