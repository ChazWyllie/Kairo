import { NextRequest, NextResponse } from "next/server";
import { requireCoachAuth } from "@/lib/auth";
import { getCoachDashboard } from "@/services/coach";

/**
 * GET /api/coach (Authorization: Bearer COACH_SECRET)
 *
 * Coach dashboard API — exception-first data for the coach portal.
 * Returns portfolio stats + per-client health with triage flags.
 *
 * Per dashboard_prompt.md:
 * - "Who needs me right now?" — flag missed workouts, overdue check-ins
 * - 7/30-day training adherence per client
 * - Portfolio: active count, at-risk count, average adherence, total leads
 *
 * Security:
 * - Protected by COACH_SECRET env var (shared secret for MVP)
 * - No member IDs or Stripe IDs in response
 * - No PII logged
 *
 * Post-MVP: Replace shared secret with proper admin auth.
 */

export async function GET(request: NextRequest) {
  try {
    // ── Auth: Authorization header with constant-time comparison ──
    if (!requireCoachAuth(request)) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing coach secret",
          },
        },
        { status: 401 }
      );
    }

    const data = await getCoachDashboard();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown coach error";
    console.error("[coach] Error:", message);

    return NextResponse.json(
      {
        error: {
          code: "COACH_ERROR",
          message: "Failed to load coach dashboard data",
        },
      },
      { status: 500 }
    );
  }
}
