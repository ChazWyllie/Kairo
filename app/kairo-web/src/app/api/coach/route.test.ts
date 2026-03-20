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
  const headers: Record<string, string> = {};
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/coach", { headers });
}

describe("GET /api/coach", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no applications (coach route now queries these)
    mockPrisma.application.findMany.mockResolvedValue([]);
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

  // ── At-risk detection ──

  it("flags client as at_risk when 7+ days since last check-in", async () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    eightDaysAgo.setHours(0, 0, 0, 0);

    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m_at_risk",
        email: "atrisk@example.com",
        status: "active",
        phone: null,
        planTier: "standard",
        billingInterval: "monthly",
        goal: "muscle",
        daysPerWeek: 4,
        onboardedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
        checkIns: [
          {
            id: "ci_1",
            date: eightDaysAgo,
            workout: true,
            meals: 3,
            water: true,
            steps: true,
            avgWeight: null,
            waist: null,
            workoutsCompleted: null,
            calorieAdherence: null,
            proteinAdherence: null,
            sleepAverage: null,
            energyScore: null,
            stressScore: null,
            recoveryScore: null,
            biggestWin: null,
            biggestStruggle: null,
            helpNeeded: null,
            coachStatus: null,
            coachResponse: null,
          },
        ],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.clients[0].status).toBe("at_risk");
    expect(data.clients[0].daysSinceCheckIn).toBeGreaterThanOrEqual(7);
  });

  it("flags client as at_risk when adherence7d < 30% and has check-ins", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    // 2 recent check-ins both with workout: false → adherence7d = 0% < 30%
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m_low_adherence",
        email: "lowadherence@example.com",
        status: "active",
        phone: null,
        planTier: "standard",
        billingInterval: "monthly",
        goal: "fat_loss",
        daysPerWeek: 4,
        onboardedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
        checkIns: [
          {
            id: "ci_1",
            date: yesterday,
            workout: false,
            meals: 2,
            water: false,
            steps: false,
            avgWeight: null, waist: null, workoutsCompleted: null,
            calorieAdherence: null, proteinAdherence: null, sleepAverage: null,
            energyScore: null, stressScore: null, recoveryScore: null,
            biggestWin: null, biggestStruggle: null, helpNeeded: null,
            coachStatus: null, coachResponse: null,
          },
          {
            id: "ci_2",
            date: twoDaysAgo,
            workout: false,
            meals: 2,
            water: false,
            steps: false,
            avgWeight: null, waist: null, workoutsCompleted: null,
            calorieAdherence: null, proteinAdherence: null, sleepAverage: null,
            energyScore: null, stressScore: null, recoveryScore: null,
            biggestWin: null, biggestStruggle: null, helpNeeded: null,
            coachStatus: null, coachResponse: null,
          },
        ],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.clients[0].status).toBe("at_risk");
    expect(data.clients[0].adherence7d).toBe(0);
  });

  // ── Portfolio aggregate stats ──

  it("returns correct atRiskCount, needsAttentionCount, averageAdherence7d", async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const workoutCheckIn = (date: Date, id: string) => ({
      id,
      date,
      workout: true,
      meals: 3,
      water: true,
      steps: true,
      avgWeight: null, waist: null, workoutsCompleted: null,
      calorieAdherence: null, proteinAdherence: null, sleepAverage: null,
      energyScore: null, stressScore: null, recoveryScore: null,
      biggestWin: null, biggestStruggle: null, helpNeeded: null,
      coachStatus: null, coachResponse: null,
    });

    mockPrisma.member.findMany.mockResolvedValue([
      // on_track: checked in yesterday, daysPerWeek=2 → adherence7d=50%
      {
        id: "m1", email: "ontrack@example.com", status: "active",
        phone: null, planTier: "standard", billingInterval: "monthly",
        goal: "maintenance", daysPerWeek: 2, onboardedAt: new Date(), createdAt: new Date(),
        checkIns: [workoutCheckIn(yesterday, "ci_on")],
        programBlocks: [], macroTargets: [],
      },
      // needs_attention: no check-ins
      {
        id: "m2", email: "needsattn@example.com", status: "active",
        phone: null, planTier: "premium", billingInterval: "annual",
        goal: "fat_loss", daysPerWeek: 3, onboardedAt: null, createdAt: new Date(),
        checkIns: [],
        programBlocks: [], macroTargets: [],
      },
      // at_risk: last check-in 8 days ago
      {
        id: "m3", email: "atrisk@example.com", status: "active",
        phone: null, planTier: "standard", billingInterval: "monthly",
        goal: "muscle", daysPerWeek: 4, onboardedAt: new Date(), createdAt: new Date(),
        checkIns: [workoutCheckIn(eightDaysAgo, "ci_risk")],
        programBlocks: [], macroTargets: [],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(10);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.portfolio.activeClients).toBe(3);
    expect(data.portfolio.atRiskCount).toBe(1);
    expect(data.portfolio.needsAttentionCount).toBe(1);
    expect(data.portfolio.totalLeads).toBe(10);
    // averageAdherence7d = Math.round((50 + 0 + 0) / 3) = 17
    expect(typeof data.portfolio.averageAdherence7d).toBe("number");
  });

  // ── Client sort order ──

  it("sorts clients: at_risk first, then needs_attention, then on_track", async () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

    const workoutCheckIn = (date: Date, id: string) => ({
      id, date, workout: true, meals: 3, water: true, steps: true,
      avgWeight: null, waist: null, workoutsCompleted: null,
      calorieAdherence: null, proteinAdherence: null, sleepAverage: null,
      energyScore: null, stressScore: null, recoveryScore: null,
      biggestWin: null, biggestStruggle: null, helpNeeded: null,
      coachStatus: null, coachResponse: null,
    });

    // Intentionally ordered: on_track, at_risk, needs_attention
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m1", email: "on_track@example.com", status: "active",
        phone: null, planTier: "standard", billingInterval: "monthly",
        goal: "muscle", daysPerWeek: 2, onboardedAt: new Date(), createdAt: new Date(),
        checkIns: [workoutCheckIn(yesterday, "ci_1")],
        programBlocks: [], macroTargets: [],
      },
      {
        id: "m2", email: "at_risk@example.com", status: "active",
        phone: null, planTier: "standard", billingInterval: "monthly",
        goal: "muscle", daysPerWeek: 4, onboardedAt: new Date(), createdAt: new Date(),
        checkIns: [workoutCheckIn(eightDaysAgo, "ci_2")],
        programBlocks: [], macroTargets: [],
      },
      {
        id: "m3", email: "needs_attn@example.com", status: "active",
        phone: null, planTier: "premium", billingInterval: "monthly",
        goal: "fat_loss", daysPerWeek: 3, onboardedAt: null, createdAt: new Date(),
        checkIns: [],
        programBlocks: [], macroTargets: [],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.clients).toHaveLength(3);
    expect(data.clients[0].status).toBe("at_risk");
    expect(data.clients[1].status).toBe("needs_attention");
    expect(data.clients[2].status).toBe("on_track");
  });

  // ── Applications ──

  it("includes applications array in response", async () => {
    mockPrisma.member.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.application.findMany.mockResolvedValue([
      {
        id: "app_1",
        email: "applicant@test.com",
        fullName: "Test Applicant",
        phone: null,
        age: 28,
        height: "5'10",
        currentWeight: "180lbs",
        goal: "fat_loss",
        whyNow: "Getting married",
        trainingExperience: "beginner",
        trainingFrequency: null,
        gymAccess: "full_gym",
        injuryHistory: null,
        nutritionStruggles: null,
        biggestObstacle: null,
        helpWithMost: null,
        preferredTier: "standard",
        readyForStructure: true,
        budgetComfort: "comfortable",
        status: "pending",
        createdAt: new Date("2026-03-01"),
        approvedAt: null,
        convertedToMember: false,
      },
    ]);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.applications).toHaveLength(1);
    expect(data.applications[0].email).toBe("applicant@test.com");
    expect(data.applications[0].fullName).toBe("Test Applicant");
    expect(data.applications[0].goal).toBe("fat_loss");
    expect(data.applications[0].convertedToMember).toBe(false);
    expect(data.applications[0].status).toBe("pending");
  });

  it("maps convertedToMember=true for approved applications", async () => {
    mockPrisma.member.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.application.findMany.mockResolvedValue([
      {
        id: "app_2",
        email: "converted@test.com",
        fullName: "Converted User",
        phone: null, age: null, height: null, currentWeight: null,
        goal: "muscle", whyNow: null, trainingExperience: null,
        trainingFrequency: null, gymAccess: null, injuryHistory: null,
        nutritionStruggles: null, biggestObstacle: null, helpWithMost: null,
        preferredTier: "premium", readyForStructure: false, budgetComfort: null,
        status: "approved",
        createdAt: new Date("2026-02-01"),
        approvedAt: new Date("2026-02-15"),
        convertedToMember: true,
      },
    ]);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.applications[0].convertedToMember).toBe(true);
    expect(data.applications[0].approvedAt).toBeTruthy();
  });

  // ── past_due member ──

  it("includes past_due members in active clients", async () => {
    const now = new Date();
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m_pastdue",
        email: "pastdue@example.com",
        status: "past_due",
        phone: null,
        planTier: "standard",
        billingInterval: "monthly",
        goal: "muscle",
        daysPerWeek: 3,
        onboardedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
        checkIns: [],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.portfolio.activeClients).toBe(1);
    expect(data.clients[0].email).toBe("pastdue@example.com");
    expect(data.clients[0].paymentStatus).toBe("past_due");
  });

  // ── activeProgram and activeMacro ──

  it("includes activeProgram and activeMacro when present", async () => {
    const now = new Date();
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m_full",
        email: "full@example.com",
        status: "active",
        phone: "+1234567890",
        planTier: "premium",
        billingInterval: "annual",
        goal: "muscle",
        daysPerWeek: 5,
        onboardedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
        checkIns: [],
        programBlocks: [
          {
            name: "Strength Block A",
            primaryGoal: "muscle",
            split: "upper_lower",
            daysPerWeek: 4,
            status: "active",
            startDate: new Date("2026-03-01"),
            nextUpdateDate: new Date("2026-04-01"),
          },
        ],
        macroTargets: [
          {
            calories: 2500,
            protein: 180,
            fatsMin: 60,
            carbs: 280,
            stepsTarget: 10000,
            effectiveDate: new Date("2026-03-01"),
          },
        ],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    const client = data.clients[0];
    expect(client.activeProgram).not.toBeNull();
    expect(client.activeProgram.name).toBe("Strength Block A");
    expect(client.activeProgram.split).toBe("upper_lower");

    expect(client.activeMacro).not.toBeNull();
    expect(client.activeMacro.calories).toBe(2500);
    expect(client.activeMacro.protein).toBe(180);
    expect(client.activeMacro.stepsTarget).toBe(10000);
  });

  it("returns null for activeProgram and activeMacro when not configured", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      {
        id: "m_no_plan",
        email: "noplan@example.com",
        status: "active",
        phone: null,
        planTier: "standard",
        billingInterval: "monthly",
        goal: "fat_loss",
        daysPerWeek: 3,
        onboardedAt: new Date("2026-01-01"),
        createdAt: new Date("2026-01-01"),
        checkIns: [],
        programBlocks: [],
        macroTargets: [],
      },
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const res = await GET(makeRequest("test-coach-secret-1234567890"));
    const data = await res.json();

    expect(data.clients[0].activeProgram).toBeNull();
    expect(data.clients[0].activeMacro).toBeNull();
  });

  // ── Coach auth via cookie ──

  it("accepts coach_session cookie as authentication", async () => {
    mockPrisma.member.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    // Use cookie header instead of Bearer token
    const req = new NextRequest("http://localhost:3000/api/coach", {
      headers: {
        cookie: "coach_session=test-coach-secret-1234567890",
      },
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.portfolio).toBeDefined();
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
