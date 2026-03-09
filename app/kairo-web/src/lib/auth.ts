import { NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import { env } from "@/lib/env";

/**
 * JWT-based session management for member auth.
 *
 * Uses a simple HMAC-based JWT (no external library) since we only need
 * basic claims: { email, iat, exp }.
 *
 * Session cookie: httpOnly, secure, sameSite=strict, 7-day expiry.
 *
 * Security:
 * - Dedicated AUTH_SECRET for signing (independent of COACH_SECRET)
 * - Never log tokens or passwords
 * - Short-lived tokens (7 days)
 * - Constant-time signature comparison
 */

const SESSION_COOKIE_NAME = "kairo_session";
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface SessionPayload {
  email: string;
  iat: number;
  exp: number;
}

/**
 * Get the dedicated signing secret for session JWTs.
 * Uses AUTH_SECRET — fully independent of COACH_SECRET.
 * Fails loudly if missing (env.ts enforces this at startup).
 */
function getSecret(): string {
  return env.AUTH_SECRET;
}

/**
 * Base64url encode a string.
 */
function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Create an HMAC-SHA256 signature using the Web Crypto API.
 */
async function hmacSign(data: string): Promise<string> {
  const secret = getSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(sig)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Create a signed JWT for a member session.
 */
export async function createSessionToken(email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    email,
    iat: now,
    exp: now + SESSION_EXPIRY_SECONDS,
  };

  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64url(JSON.stringify(payload));
  const signature = await hmacSign(`${header}.${body}`);

  return `${header}.${body}.${signature}`;
}

/**
 * Verify and decode a JWT session token.
 * Returns the payload if valid, null if expired/tampered.
 */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSig = await hmacSign(`${header}.${body}`);

    // Constant-time comparison to prevent timing attacks on JWT signatures
    if (!timingSafeCompare(signature, expectedSig)) return null;

    const payload: SessionPayload = JSON.parse(
      Buffer.from(body, "base64").toString()
    );

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Get session cookie config for Set-Cookie header.
 */
export function getSessionCookieConfig(token: string): string {
  const isProduction = process.env.NODE_ENV === "production";
  const parts = [
    `${SESSION_COOKIE_NAME}=${token}`,
    `Path=/`,
    `HttpOnly`,
    `SameSite=Strict`,
    `Max-Age=${SESSION_EXPIRY_SECONDS}`,
  ];
  if (isProduction) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

/**
 * Get a clear-cookie string to delete the session.
 */
export function getClearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

/**
 * Extract session token from request cookies.
 */
export function getSessionFromRequest(
  cookieHeader: string | null
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${SESSION_COOKIE_NAME}=([^;]+)`)
  );
  return match ? match[1] : null;
}

// ── Coach / Cron auth utilities ──

/**
 * Extract a Bearer token from the Authorization header.
 */
function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

/**
 * Constant-time comparison of two strings.
 * Prevents timing side-channels when comparing secrets.
 */
function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf-8");
  const bufB = Buffer.from(b, "utf-8");
  // Always perform constant-time comparison even when lengths differ.
  // Pad the shorter buffer to avoid leaking length information.
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);
  return timingSafeEqual(paddedA, paddedB) && bufA.length === bufB.length;
}

/**
 * Verify the request carries a valid coach secret in the Authorization header.
 * Returns true if the secret matches COACH_SECRET.
 *
 * Usage:
 *   if (!requireCoachAuth(request)) return NextResponse.json(..., { status: 401 });
 */
export function requireCoachAuth(request: NextRequest): boolean {
  const token = extractBearer(request);
  if (!token || !env.COACH_SECRET) return false;
  return timingSafeCompare(token, env.COACH_SECRET);
}

/**
 * Verify the request carries a valid cron secret in the Authorization header.
 * Returns true if the secret matches CRON_SECRET.
 */
export function requireCronAuth(request: NextRequest): boolean {
  const token = extractBearer(request);
  if (!token || !env.CRON_SECRET) return false;
  return timingSafeCompare(token, env.CRON_SECRET);
}

// ── Member auth with coach override ──

export type AuthResult =
  | { authorized: true; role: "coach" | "member"; email: string }
  | { authorized: false; role: null; email: null };

/**
 * Verify that the request is authorised to access data for `requestedEmail`.
 *
 * Two paths:
 * 1. **Coach Bearer token** — `Authorization: Bearer COACH_SECRET` allows access
 *    to any member's data (used by the admin dashboard).
 * 2. **Session cookie** — the JWT `email` claim must match `requestedEmail`
 *    (case-insensitive). Members can only access their own data.
 *
 * Returns `{ authorized: true, role, email }` on success, or
 * `{ authorized: false }` when the request should be rejected.
 *
 * Usage:
 * ```ts
 * const auth = await requireMemberOrCoachAuth(request, email);
 * if (!auth.authorized) return NextResponse.json({ error: ... }, { status: 401 });
 * ```
 */
export async function requireMemberOrCoachAuth(
  request: NextRequest,
  requestedEmail: string
): Promise<AuthResult> {
  // Path 1: Coach bearer token — allows any email
  if (requireCoachAuth(request)) {
    return { authorized: true, role: "coach", email: requestedEmail };
  }

  // Path 2: Session cookie — email must match
  const cookieHeader = request.headers.get("cookie");
  const sessionToken = getSessionFromRequest(cookieHeader);
  if (!sessionToken) {
    return { authorized: false, role: null, email: null };
  }

  const payload = await verifySessionToken(sessionToken);
  if (!payload) {
    return { authorized: false, role: null, email: null };
  }

  // Case-insensitive email match — members can only see their own data
  if (payload.email.toLowerCase() !== requestedEmail.toLowerCase()) {
    return { authorized: false, role: null, email: null };
  }

  return { authorized: true, role: "member", email: payload.email };
}

export { SESSION_COOKIE_NAME };
