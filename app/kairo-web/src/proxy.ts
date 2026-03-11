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

export function proxy(request: NextRequest): NextResponse {
  // Generate a unique nonce per request for CSP script-src.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Forward nonce to the app via request header so Server Components
  // can read it with headers().get("x-nonce") and inject into <Script nonce=...>.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

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

  // Content Security Policy — 'unsafe-inline' for script-src is required because
  // Next.js injects inline scripts during hydration that cannot be nonced without
  // wiring the x-nonce header through layout.tsx. The nonce is still generated and
  // forwarded (x-nonce header) for future migration.
  // TODO: once layout.tsx stamps nonce on <script> tags, switch to:
  //   `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`
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
