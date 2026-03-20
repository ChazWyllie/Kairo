/**
 * Tests for POST /api/coach/launch-email
 *
 * Coverage: coach auth, deduplication of leads + applications,
 * sent/skipped counters, and error handling.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockSendLaunchEmail } from "@/test/setup";

import { POST } from "./route";

const COACH_SECRET = "test-coach-secret-1234567890";

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== undefined) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/coach/launch-email", {
    method: "POST",
    headers,
  });
}

describe("POST /api/coach/launch-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendLaunchEmail.mockResolvedValue(undefined);
    mockPrisma.application.findMany.mockResolvedValue([]);
    mockPrisma.lead.findMany.mockResolvedValue([]);
  });

  // ── Auth ──

  it("returns 401 without coach auth", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 with wrong secret", async () => {
    const res = await POST(makeRequest("wrong-secret"));

    expect(res.status).toBe(401);
  });

  // ── Deduplication ──

  it("deduplicates leads and applications by email (applications take priority)", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { email: "shared@test.com" },
      { email: "lead-only@test.com" },
    ]);
    mockPrisma.application.findMany.mockResolvedValue([
      { email: "shared@test.com", isFoundingMember: true },
    ]);

    const res = await POST(makeRequest(COACH_SECRET));

    expect(res.status).toBe(200);
    const data = await res.json();
    // shared@test.com should be sent once, lead-only@test.com once = 2 total
    expect(data.sent).toBe(2);
    expect(data.skipped).toBe(0);
  });

  it("sends isFoundingMember=false for lead-only emails", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { email: "lead@test.com" },
    ]);

    await POST(makeRequest(COACH_SECRET));

    expect(mockSendLaunchEmail).toHaveBeenCalledWith({
      email: "lead@test.com",
      isFoundingMember: false,
    });
  });

  it("sends isFoundingMember=true for application-sourced emails", async () => {
    mockPrisma.application.findMany.mockResolvedValue([
      { email: "founder@test.com", isFoundingMember: true },
    ]);

    await POST(makeRequest(COACH_SECRET));

    expect(mockSendLaunchEmail).toHaveBeenCalledWith({
      email: "founder@test.com",
      isFoundingMember: true,
    });
  });

  // ── Counters ──

  it("returns { sent, skipped } counts", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { email: "a@test.com" },
      { email: "b@test.com" },
    ]);

    const res = await POST(makeRequest(COACH_SECRET));

    const data = await res.json();
    expect(data.sent).toBe(2);
    expect(data.skipped).toBe(0);
  });

  it("increments skipped when sendLaunchEmail throws", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([
      { email: "ok@test.com" },
      { email: "fail@test.com" },
    ]);
    mockSendLaunchEmail
      .mockResolvedValueOnce(undefined) // ok@test.com succeeds
      .mockRejectedValueOnce(new Error("Email failed")); // fail@test.com fails

    const res = await POST(makeRequest(COACH_SECRET));

    const data = await res.json();
    expect(data.sent).toBe(1);
    expect(data.skipped).toBe(1);
  });

  it("returns { sent: 0, skipped: 0 } when no leads or applications", async () => {
    const res = await POST(makeRequest(COACH_SECRET));

    const data = await res.json();
    expect(data.sent).toBe(0);
    expect(data.skipped).toBe(0);
  });

  // ── Error handling ──

  it("returns 500 when database query fails", async () => {
    mockPrisma.lead.findMany.mockRejectedValue(new Error("DB connection lost"));

    const res = await POST(makeRequest(COACH_SECRET));

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe("LAUNCH_EMAIL_ERROR");
  });
});
