import { NextRequest, NextResponse } from "next/server";
import { requireCoachAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLaunchEmail } from "@/services/email";

/**
 * POST /api/coach/launch-email
 *
 * Coach-triggered batch launch email. Sends the Kairo launch announcement
 * to all waitlist signups (Applications + Leads), deduplicated by email.
 *
 * Applications take priority for dedup (they have isFoundingMember flag).
 * Skips converted records and opted-out leads.
 *
 * Returns { sent: number, skipped: number }.
 */
export async function POST(request: NextRequest) {
  if (!requireCoachAuth(request)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing coach secret" } },
      { status: 401 }
    );
  }

  try {
    const [applications, leads] = await Promise.all([
      prisma.application.findMany({
        where: {
          convertedToMember: false,
          status: { not: "rejected" },
        },
        select: { email: true, isFoundingMember: true },
      }),
      prisma.lead.findMany({
        where: {
          convertedAt: null,
          nurtureOptedOut: false,
        },
        select: { email: true },
      }),
    ]);

    // Build deduplicated map — Applications take priority
    const emailMap = new Map<string, { isFoundingMember: boolean }>();

    for (const lead of leads) {
      emailMap.set(lead.email.toLowerCase(), { isFoundingMember: false });
    }
    for (const app of applications) {
      emailMap.set(app.email.toLowerCase(), { isFoundingMember: app.isFoundingMember });
    }

    let sent = 0;
    let skipped = 0;

    for (const [email, { isFoundingMember }] of emailMap) {
      try {
        await sendLaunchEmail({ email, isFoundingMember });
        sent++;
      } catch {
        skipped++;
      }
    }

    return NextResponse.json({ sent, skipped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[launch-email] Error:", message);
    return NextResponse.json(
      { error: { code: "LAUNCH_EMAIL_ERROR", message: "Failed to send launch emails" } },
      { status: 500 }
    );
  }
}
