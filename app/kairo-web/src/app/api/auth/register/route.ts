import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookieConfig,
} from "@/lib/auth";
import { registerLimiter } from "@/lib/rate-limit";

/**
 * POST /api/auth/register
 *
 * Set a password for an existing active member.
 * Only members with status "active" can register.
 *
 * Security:
 * - bcrypt with cost 12
 * - Never log passwords
 * - Only works for existing active members (prevents account creation)
 */

const RegisterSchema = z.object({
  email: z.string().email("A valid email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid registration data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // ── Rate limiting ──
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rateCheck = registerLimiter.check(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many registration attempts. Please try again later.",
          },
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      );
    }

    // Check member exists and is active
    const member = await prisma.member.findUnique({
      where: { email },
      select: { id: true, status: true, passwordHash: true },
    });

    // Generic error for both "not found/not eligible" and "already registered"
    // to prevent account enumeration attacks.
    if (!member || member.status !== "active" || member.passwordHash) {
      return NextResponse.json(
        {
          error: {
            code: "REGISTRATION_FAILED",
            message:
              "Unable to register. Please check your email or contact support.",
          },
        },
        { status: 403 }
      );
    }

    // Hash password with bcrypt (dynamic import to keep bundle small)
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.member.update({
      where: { email },
      data: { passwordHash },
    });

    // Create session token
    const token = await createSessionToken(email);

    console.log("[auth/register] Password set for member");

    const response = NextResponse.json({ status: "ok" }, { status: 201 });
    response.headers.set("Set-Cookie", getSessionCookieConfig(token));
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[auth/register] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "REGISTER_ERROR",
          message: "Failed to register",
        },
      },
      { status: 500 }
    );
  }
}
