import { NextResponse } from "next/server";
import { getClearSessionCookie, getClearCoachSessionCookie } from "@/lib/auth";

/**
 * POST /api/auth/logout
 *
 * Clears both the member session cookie and the coach session cookie.
 * Uses append (not set) so both Set-Cookie headers are sent in the response.
 */
export async function POST() {
  const response = NextResponse.json({ status: "ok" });
  response.headers.append("Set-Cookie", getClearSessionCookie());
  response.headers.append("Set-Cookie", getClearCoachSessionCookie());
  return response;
}
