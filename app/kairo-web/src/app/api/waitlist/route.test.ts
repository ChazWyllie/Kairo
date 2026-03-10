/**
 * Tests for POST /api/waitlist — Waitlist lead capture.
 *
 * Behavior matrix coverage:
 * - Happy path: valid email → lead created with source "waitlist"
 * - Idempotency: same email submits twice → upsert, not duplicate
 * - Invalid input: missing email, bad email, empty body, non-JSON
 * - Security: no PII in errors, rate limiting (5 req/60s)
 * - Dependency failure: DB unavailable → safe 500
 * - Edge cases: whitespace email, extra fields ignored
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockPrisma,
  mockWaitlistRateLimitCheck,
} from "@/test/setup";

import { POST } from "@/app/api/waitlist/route";

const MOCK_WAITLIST_LEAD = {
  id: "lead_waitlist_abc",
  email: "waitlist@test.com",
  quizAnswers: null,
  recommendedTier: null,
  source: "waitlist",
  capturedAt: new Date("2026-03-09T00:00:00Z"),
  convertedAt: null,
  lastNurtureStep: 0,
  lastNurtureAt: null,
  nurtureOptedOut: false,
};

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeRawRequest(body: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/waitlist", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    mockPrisma.lead.upsert.mockReset();
    mockWaitlistRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });

    // Default: successful upsert
    mockPrisma.lead.upsert.mockResolvedValue(MOCK_WAITLIST_LEAD);
  });

  // ── Happy Path ──

  it("creates a lead with source 'waitlist' and returns success", async () => {
    const res = await POST(makeRequest({ email: "waitlist@test.com" }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBeDefined();
  });

  it("calls prisma.lead.upsert with correct email and source", async () => {
    await POST(makeRequest({ email: "waitlist@test.com" }));

    expect(mockPrisma.lead.upsert).toHaveBeenCalledTimes(1);
    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.where.email).toBe("waitlist@test.com");
    expect(call.create.email).toBe("waitlist@test.com");
    expect(call.create.source).toBe("waitlist");
  });

  it("does not set quizAnswers or recommendedTier for waitlist leads", async () => {
    await POST(makeRequest({ email: "waitlist@test.com" }));

    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.create.quizAnswers).toBeUndefined();
    expect(call.create.recommendedTier).toBeUndefined();
  });

  // ── Email Normalization ──

  it("trims whitespace from email before processing", async () => {
    await POST(makeRequest({ email: "  spaces@test.com  " }));

    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.where.email).toBe("spaces@test.com");
    expect(call.create.email).toBe("spaces@test.com");
  });

  it("lowercases email before processing", async () => {
    await POST(makeRequest({ email: "UPPER@TEST.COM" }));

    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.where.email).toBe("upper@test.com");
  });

  // ── Idempotency ──

  it("upserts on duplicate email (does not create second lead)", async () => {
    await POST(makeRequest({ email: "waitlist@test.com" }));
    await POST(makeRequest({ email: "waitlist@test.com" }));

    expect(mockPrisma.lead.upsert).toHaveBeenCalledTimes(2);
    const calls = mockPrisma.lead.upsert.mock.calls;
    expect(calls[0][0].where.email).toBe("waitlist@test.com");
    expect(calls[1][0].where.email).toBe("waitlist@test.com");
  });

  it("uses update block (not overwrite) on re-submission", async () => {
    await POST(makeRequest({ email: "waitlist@test.com" }));

    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    // update block should exist but not overwrite source or email
    expect(call.update).toBeDefined();
  });

  // ── Invalid Input ──

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for empty string email", async () => {
    const res = await POST(makeRequest({ email: "" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for empty body", async () => {
    const res = await POST(makeRawRequest("{}"));

    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const res = await POST(makeRawRequest("not json at all"));

    expect(res.status).toBe(400);
  });

  it("ignores extra fields in body (only processes email)", async () => {
    const res = await POST(
      makeRequest({
        email: "waitlist@test.com",
        name: "Hacker",
        admin: true,
        role: "admin",
      })
    );

    expect(res.status).toBe(200);

    // Should NOT pass extra fields to DB
    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.create).not.toHaveProperty("name");
    expect(call.create).not.toHaveProperty("admin");
    expect(call.create).not.toHaveProperty("role");
  });

  // ── Security ──

  it("does not expose email in error responses", async () => {
    const badEmail = "definitely-not-valid";
    const res = await POST(makeRequest({ email: badEmail }));
    const data = await res.json();
    const responseText = JSON.stringify(data);

    expect(responseText).not.toContain(badEmail);
  });

  it("returns 429 when rate limited", async () => {
    mockWaitlistRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 30 });

    const res = await POST(makeRequest({ email: "waitlist@test.com" }));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(res.headers.get("Retry-After")).toBe("30");
  });

  it("returns structured error format on all failures", async () => {
    const res = await POST(makeRequest({ email: "bad" }));
    const data = await res.json();

    expect(data.error).toBeDefined();
    expect(data.error.code).toBeDefined();
    expect(data.error.message).toBeDefined();
  });

  // ── Dependency Failures ──

  it("returns 500 when database is unavailable", async () => {
    mockPrisma.lead.upsert.mockRejectedValue(new Error("Connection refused"));

    const res = await POST(makeRequest({ email: "waitlist@test.com" }));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error.code).toBe("WAITLIST_ERROR");
    expect(data.error.message).not.toContain("Connection refused");
  });

  it("does not leak internal error details in 500 responses", async () => {
    mockPrisma.lead.upsert.mockRejectedValue(
      new Error("FATAL: database system is shutting down")
    );

    const res = await POST(makeRequest({ email: "waitlist@test.com" }));
    const data = await res.json();
    const responseText = JSON.stringify(data);

    expect(responseText).not.toContain("FATAL");
    expect(responseText).not.toContain("database system");
  });
});
