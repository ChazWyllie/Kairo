/**
 * Next.js Edge Middleware — security headers on all responses.
 *
 * This file MUST be named middleware.ts and located at src/middleware.ts
 * (or project root) for Next.js to auto-invoke it on every request.
 *
 * Delegates to proxy.ts for header logic. Keeps middleware thin.
 *
 * @see docs/03-threat-model.md §4.3 (XSS)
 * @see docs/07-security-controls.md §6 (Transport & Infrastructure)
 */
export { proxy as middleware, config } from "@/proxy";
