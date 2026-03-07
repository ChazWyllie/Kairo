import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health
 *
 * Diagnostic endpoint — tests DB connectivity.
 * Returns { ok: true } if Prisma can reach the database.
 * TEMPORARY — remove before production launch.
 */
export async function GET() {
  // Diagnostic: check if env var is even visible
  const dbUrl = process.env.DATABASE_URL;
  const hasUrl = !!dbUrl;
  const urlPrefix = dbUrl ? dbUrl.substring(0, 20) + "..." : "NOT SET";

  try {
    const count = await prisma.member.count();
    return NextResponse.json({ ok: true, memberCount: count, hasUrl, urlPrefix });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message, hasUrl, urlPrefix }, { status: 500 });
  }
}
