import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/auth";
import { sendCheckInReminder } from "@/services/email";

/**
 * POST /api/cron/checkin-reminder (Authorization: Bearer CRON_SECRET)
 *
 * Weekly cron job — sends check-in reminders to active members
 * who haven't submitted a check-in in the last 3+ days.
 *
 * Designed to be called by Vercel Cron or external scheduler.
 *
 * Security:
 * - Protected by CRON_SECRET
 * - No PII logged beyond email count
 * - Fire-and-forget email sends
 */

export async function POST(request: NextRequest) {
  // ── Auth: Authorization header with constant-time comparison ──
  if (!requireCronAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid cron secret" } },
      { status: 401 }
    );
  }

  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find active members who haven't checked in recently
    const members = await prisma.member.findMany({
      where: {
        status: "active",
        onboardedAt: { not: null }, // only onboarded members
      },
      select: {
        email: true,
        fullName: true,
        checkIns: {
          orderBy: { date: "desc" },
          take: 1,
          select: { date: true },
        },
      },
    });

    const needsReminder = members.filter((m) => {
      if (m.checkIns.length === 0) return true; // never checked in
      const lastDate = new Date(m.checkIns[0].date);
      return lastDate < threeDaysAgo;
    });

    let sent = 0;
    let errors = 0;

    for (const member of needsReminder) {
      try {
        await sendCheckInReminder({
          email: member.email,
          fullName: member.fullName ?? "there",
        });
        sent++;
      } catch {
        errors++;
      }
    }

    console.log("[cron] Check-in reminders:", {
      eligible: needsReminder.length,
      sent,
      errors,
    });

    return NextResponse.json({
      status: "ok",
      eligible: needsReminder.length,
      sent,
      errors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[cron] Reminder error:", message);

    return NextResponse.json(
      { error: { code: "CRON_ERROR", message: "Failed to send reminders" } },
      { status: 500 }
    );
  }
}
