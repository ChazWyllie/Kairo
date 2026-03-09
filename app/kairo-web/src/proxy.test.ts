/**
 * Tests for security headers proxy and middleware wiring.
 *
 * Coverage: header presence on HTML responses, header presence on API responses,
 * correct CSP directives, no interference with webhook POST, middleware re-export.
 */
import { describe, it, expect } from "vitest";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";

function makeRequest(path: string, method = "GET"): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, { method });
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

describe("Middleware re-export wiring", () => {
  it("middleware.ts re-exports proxy as middleware", async () => {
    // Verifies that src/middleware.ts correctly re-exports the function
    const middlewareModule = await import("@/middleware");
    expect(middlewareModule.middleware).toBeDefined();
    expect(typeof middlewareModule.middleware).toBe("function");
  });

  it("middleware.ts re-exports config with matcher", async () => {
    const middlewareModule = await import("@/middleware");
    expect(middlewareModule.config).toBeDefined();
    expect(middlewareModule.config.matcher).toBeDefined();
    expect(Array.isArray(middlewareModule.config.matcher)).toBe(true);
  });

  it("middleware function produces security headers", async () => {
    const { middleware } = await import("@/middleware");
    const response = middleware(makeRequest("/test"));
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age="
    );
  });
});
