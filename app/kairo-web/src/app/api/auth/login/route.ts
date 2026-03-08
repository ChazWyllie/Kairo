import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookieConfig,
} from "@/lib/auth";

/**
 * POST /api/auth/login
 *
 * Authenticate a member with email + password.
 * Returns a session cookie on success.
 *
 * Security:
 * - bcrypt verify (constant-time comparison)
 * - Generic error message (don't reveal if email exists)
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
