import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMemberOrCoachAuth } from "@/lib/auth";
import { runAdaptation } from "@/services/adaptation";

/**
 * GET /api/adaptation?email=...
 *
 * Returns adaptation recommendations + insights for a member.
 * Requires at least 3 check-ins in the last 28 days.
 *
 * Security:
 * - Auth: session cookie (email match) or coach Bearer token
 * - No PII logged
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !z.string().email().safeParse(email).success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "A valid email query parameter is required",
          },
        },
        { status: 400 },
      );
    }

    const auth = await requireMemberOrCoachAuth(request, email);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }

    const result = await runAdaptation(email);

    if (!result.ok) {
      return NextResponse.json(
        {
          error: {
            code: result.code,
            message: result.message,
          },
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      recommendations: result.recommendations,
      insights: result.insights,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown adaptation error";
    console.error("[adaptation] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "ADAPTATION_ERROR",
          message: "Failed to compute adaptation recommendations",
        },
      },
      { status: 500 },
    );
  }
}
