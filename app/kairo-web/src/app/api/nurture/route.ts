/**
 * POST /api/nurture — Cron-triggered nurture email batch processor.
 *
 * Protected by CRON_SECRET (Authorization: Bearer <secret>).
 * Finds eligible quiz leads and sends the next drip email in sequence.
 *
 * Returns batch results: { processed, sent, skipped, errors }.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/auth";
import { processNurtureBatch } from "@/services/nurture";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth: require CRON_SECRET via Authorization header ──
  if (!requireCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Process batch ──
  try {
    const result = await processNurtureBatch();

    console.log("[nurture] Batch complete:", result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error(
      "[nurture] Batch failed:",
      error instanceof Error ? error.message : "unknown"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
