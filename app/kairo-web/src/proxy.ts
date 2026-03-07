/**
 * Next.js Edge Proxy — security headers on all responses.
 *
 * Sets OWASP-recommended headers:
 * - CSP (Content Security Policy)
 * - X-Content-Type-Options
 * - X-Frame-Options
 * - Referrer-Policy
 * - Permissions-Policy
 * - Strict-Transport-Security (HSTS)
 *
 * Runs on every request. Does not block — only decorates responses.
 * See docs/03-threat-model.md §4.3 (XSS) and docs/07-security-controls.md §6.
 */
import { NextRequest, NextResponse } from "next/server";

export function proxy(_request: NextRequest): NextResponse {
  const response = NextResponse.next();

  // Prevent MIME type sniffing
  response.headers.set("x-content-type-options", "nosniff");

  // Prevent clickjacking
  response.headers.set("x-frame-options", "DENY");

  // Control referrer information
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content Security Policy — allows Stripe JS, inline styles (Tailwind),
  // and inline scripts (Next.js hydration/Turbopack injects inline <script> tags).
  // TODO: Migrate to nonce-based CSP for stricter script-src control.
  response.headers.set(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.stripe.com",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  // HSTS — enforce HTTPS (1 year, include subdomains)
  response.headers.set(
    "strict-transport-security",
    "max-age=31536000; includeSubDomains"
  );

  return response;
}

/**
 * Matcher — apply to all paths except static assets and Next.js internals.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
