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
  try {
    const count = await prisma.member.count();
    return NextResponse.json({ ok: true, memberCount: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
