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
 * - AUTH_SECRET derived from COACH_SECRET (MVP — dedicated secret post-MVP)
 * - Never log tokens or passwords
 * - Short-lived tokens (7 days)
 */

const SESSION_COOKIE_NAME = "kairo_session";
const SESSION_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

interface SessionPayload {
  email: string;
  iat: number;
  exp: number;
}

/**
 * Get the signing secret. Uses COACH_SECRET as the base and derives
 * a separate key for auth tokens.
 */
function getSecret(): string {
  const base = env.COACH_SECRET ?? "dev-fallback-secret-not-for-production";
  return `auth:${base}`;
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

    if (signature !== expectedSig) return null;

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

export { SESSION_COOKIE_NAME };
