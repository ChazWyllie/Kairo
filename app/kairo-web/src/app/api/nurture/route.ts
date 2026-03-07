/**
 * POST /api/nurture — Cron-triggered nurture email batch processor.
 *
 * Protected by CRON_SECRET (Authorization: Bearer <secret>).
 * Finds eligible quiz leads and sends the next drip email in sequence.
 *
 * Returns batch results: { processed, sent, skipped, errors }.
 */
import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { processNurtureBatch } from "@/services/nurture";

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── Auth: require CRON_SECRET ──
  if (!env.CRON_SECRET) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (token !== env.CRON_SECRET) {
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
