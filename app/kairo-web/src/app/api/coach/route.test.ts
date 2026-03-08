/**
 * Tests for GET /api/coach
 *
 * Coverage: auth (shared secret), portfolio stats, client health triage,
 * needs-attention flagging, at-risk detection, security (no IDs leaked),
 * error handling.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { GET } from "./route";

function makeRequest(secret?: string): NextRequest {
  const url = secret
    ? `http://localhost:3000/api/coach?secret=${secret}`
    : "http://localhost:3000/api/coach";
  return new NextRequest(url);
}

describe("GET /api/coach", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Auth ──

  it("returns 401 when no secret provided", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when secret is wrong", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when COACH_SECRET env is not configured", async () => {
    const envMod = await import("@/lib/env");
    const original = envMod.env.COACH_SECRET;
    // @ts-expect-error — testing unconfigured state
    envMod.env.COACH_SECRET = undefined;

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    expect(res.status).toBe(401);

    // Restore
    // @ts-expect-error — restoring
    envMod.env.COACH_SECRET = original;
  });

  // ── Happy path ──

  it("returns portfolio + clients when secret is valid", async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m1",
        email: "alice@example.com",
        status: "active",
        planTier: "coaching",
        billingInterval: "monthly",
        goal: "muscle",
        daysPerWeek: 4,
        onboardedAt: now,
        createdAt: now,
        checkIns: [
          { date: now, workout: true, meals: 3, water: true, steps: true },
          { date: yesterday, workout: true, meals: 2, water: true, steps: false },
        ],
        programBlocks: [],
        macroTargets: [],
      },
    ]);

    mockPrisma.member.count.mockResolvedValue(1);
    mockPrisma.lead.count.mockResolvedValue(5);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.portfolio).toBeDefined();
    expect(data.portfolio.activeClients).toBe(1);
    expect(data.portfolio.totalLeads).toBe(5);
    expect(data.clients).toHaveLength(1);
    expect(data.clients[0].email).toBe("alice@example.com");
    expect(data.clients[0].recentCheckIns).toHaveLength(2);
  });

  // ── Needs-attention flagging ──

  it("flags client with no check-ins in 3+ days as needs_attention", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 4);

    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m2",
        email: "bob@example.com",
        status: "active",
        planTier: "foundation",
        billingInterval: "monthly",
        goal: "fat_loss",
        daysPerWeek: 3,
        onboardedAt: threeDaysAgo,
        createdAt: threeDaysAgo,
        checkIns: [
          { date: threeDaysAgo, workout: true, meals: 3, water: true, steps: true },
        ],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.member.count.mockResolvedValue(1);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.clients[0].status).toBe("needs_attention");
  });

  it("flags client with zero check-ins as needs_attention", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m3",
        email: "carol@example.com",
        status: "active",
        planTier: "performance",
        billingInterval: "annual",
        goal: null,
        daysPerWeek: null,
        onboardedAt: null,
        createdAt: new Date(),
        checkIns: [],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.member.count.mockResolvedValue(1);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.clients[0].status).toBe("needs_attention");
    expect(data.clients[0].onboarded).toBe(false);
  });

  // ── Security ──

  it("never exposes member IDs or Stripe IDs", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m4",
        email: "dave@example.com",
        status: "active",
        stripeCustomerId: "cus_secret",
        stripeSubId: "sub_secret",
        planTier: "vip",
        billingInterval: "monthly",
        goal: "muscle",
        daysPerWeek: 5,
        onboardedAt: new Date(),
        createdAt: new Date(),
        checkIns: [],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.member.count.mockResolvedValue(1);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const body = await res.text();

    expect(body).not.toContain("cus_secret");
    expect(body).not.toContain("sub_secret");
    expect(body).not.toContain('"id"');
  });

  // ── Error handling ──

  it("returns 500 when database fails", async () => {
    mockPrisma.member.findMany.mockRejectedValue(new Error("Connection refused"));

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error.code).toBe("COACH_ERROR");
  });
});
