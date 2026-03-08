import { NextResponse } from "next/server";
import { getClearSessionCookie } from "@/lib/auth";

/**
 * POST /api/auth/logout
 *
 * Clears the session cookie.
 */
export async function POST() {
  const response = NextResponse.json({ status: "ok" });
  response.headers.set("Set-Cookie", getClearSessionCookie());
  return response;
}
