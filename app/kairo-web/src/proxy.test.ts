/**
 * Tests for security headers proxy and middleware wiring.
 *
 * Coverage: header presence on HTML responses, header presence on API responses,
 * nonce-based CSP directives, no interference with webhook POST.
 */
import { describe, it, expect } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

function makeRequest(path: string, method = "GET"): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method });
}

/** Extract a CSP directive value by name from the full CSP string. */
function getCspDirective(csp: string, name: string): string | undefined {
  return csp
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(name));
}

describe("Security headers proxy", () => {
  // ── Header Presence ──

  it("sets X-Content-Type-Options on all responses", async () => {
    const response = await proxy(makeRequest("/"));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("sets X-Frame-Options on all responses", async () => {
    const response = await proxy(makeRequest("/"));
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("sets Referrer-Policy on all responses", async () => {
    const response = await proxy(makeRequest("/"));
    expect(response.headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("sets Permissions-Policy on all responses", async () => {
    const response = await proxy(makeRequest("/"));
    const policy = response.headers.get("permissions-policy");
    expect(policy).toBeTruthy();
    expect(policy).toContain("camera=()");
    expect(policy).toContain("microphone=()");
  });

  it("sets Content-Security-Policy on all responses", async () => {
    const response = await proxy(makeRequest("/"));
    const csp = response.headers.get("content-security-policy");
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
  });

  it("sets Strict-Transport-Security on all responses", async () => {
    const response = await proxy(makeRequest("/"));
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age="
    );
  });

  // ── Nonce-based CSP ──

  it("includes a nonce in script-src instead of unsafe-inline", async () => {
    const response = await proxy(makeRequest("/"));
    const csp = response.headers.get("content-security-policy")!;
    const scriptSrc = getCspDirective(csp, "script-src");
    expect(scriptSrc).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it("includes strict-dynamic in script-src", async () => {
    const response = await proxy(makeRequest("/"));
    const csp = response.headers.get("content-security-policy")!;
    const scriptSrc = getCspDirective(csp, "script-src");
    expect(scriptSrc).toContain("'strict-dynamic'");
  });

  it("retains unsafe-inline only in style-src", async () => {
    const response = await proxy(makeRequest("/"));
    const csp = response.headers.get("content-security-policy")!;
    const styleSrc = getCspDirective(csp, "style-src");
    expect(styleSrc).toContain("'unsafe-inline'");
  });

  it("generates a unique nonce per request", async () => {
    const r1 = await proxy(makeRequest("/"));
    const r2 = await proxy(makeRequest("/"));
    const csp1 = r1.headers.get("content-security-policy")!;
    const csp2 = r2.headers.get("content-security-policy")!;
    const nonce1 = csp1.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];
    const nonce2 = csp2.match(/'nonce-([A-Za-z0-9+/=]+)'/)?.[1];
    expect(nonce1).toBeTruthy();
    expect(nonce2).toBeTruthy();
    expect(nonce1).not.toBe(nonce2);
  });

  // ── API Paths ──

  it("sets headers on API checkout path", async () => {
    const response = await proxy(makeRequest("/api/checkout", "POST"));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  it("sets headers on webhook path", async () => {
    const response = await proxy(makeRequest("/api/webhook", "POST"));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  // ── Does not block requests ──

  it("returns a response (does not block)", async () => {
    const response = await proxy(makeRequest("/"));
    // NextResponse.next() returns 200
    expect(response.status).toBe(200);
  });
});

