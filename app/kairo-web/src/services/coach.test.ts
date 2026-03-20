/**
 * Tests for services/coach.ts
 *
 * Covers: getCoachDashboard — client health triage (on_track / needs_attention /
 * at_risk), adherence calculations (7d/30d with edge cases), portfolio
 * aggregation, and client sort order.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "@/test/setup";

import { getCoachDashboard } from "@/services/coach";

// ── Helpers ──

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function makeMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "m_default",
    email: "member@test.com",
    phone: null,
    status: "active",
    planTier: "standard",
    billingInterval: "monthly",
    goal: "muscle",
    daysPerWeek: 4,
    onboardedAt: new Date(),
    createdAt: new Date(),
    checkIns: [] as { date: Date; workout: boolean; meals: number; water: boolean; steps: boolean }[],
    programBlocks: [] as unknown[],
    macroTargets: [] as unknown[],
    ...overrides,
  };
}

describe("getCoachDashboard — client triage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.application.findMany.mockResolvedValue([]);
  });

  it("marks client as on_track when checked in yesterday", async () => {
    // daysPerWeek:1 ensures adherence7d = 100% with a single recent workout
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({
        daysPerWeek: 1,
        checkIns: [{ date: daysAgo(1), workout: true, meals: 3, water: true, steps: true }],
      }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].status).toBe("on_track");
  });

  it("marks client as needs_attention when no check-ins", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ checkIns: [] }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].status).toBe("needs_attention");
  });

  it("marks client as needs_attention when 3-6 days since last check-in", async () => {
    // daysPerWeek:1 ensures adherence7d ≥ 30% (100%), so status stays needs_attention not at_risk
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({
        daysPerWeek: 1,
        checkIns: [{ date: daysAgo(4), workout: true, meals: 3, water: true, steps: true }],
      }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].status).toBe("needs_attention");
  });

  it("marks client as at_risk when 7+ days since last check-in", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({
        checkIns: [{ date: daysAgo(8), workout: true, meals: 3, water: true, steps: true }],
      }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].status).toBe("at_risk");
  });

  it("marks client as at_risk when adherence7d < 30% and has check-ins", async () => {
    // 4 workouts needed per week, 0 completed → 0% adherence → at_risk
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({
        daysPerWeek: 4,
        checkIns: [
          { date: daysAgo(1), workout: false, meals: 2, water: false, steps: false },
          { date: daysAgo(2), workout: false, meals: 2, water: false, steps: false },
        ],
      }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].status).toBe("at_risk");
  });
});

describe("getCoachDashboard — adherence calculations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.application.findMany.mockResolvedValue([]);
  });

  it("falls back to 7 days/week when daysPerWeek is null", async () => {
    // 7 workouts in last 7 days → 100% adherence
    const checkIns = Array.from({ length: 7 }, (_, i) => ({
      date: daysAgo(i),
      workout: true,
      meals: 3,
      water: true,
      steps: true,
    }));

    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ daysPerWeek: null, checkIns }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].adherence7d).toBe(100);
  });

  it("caps adherence30d at 100 even with excess check-ins", async () => {
    // 30 workouts over 30 days with daysPerWeek=3 → well above cap
    const checkIns = Array.from({ length: 30 }, (_, i) => ({
      date: daysAgo(i),
      workout: true,
      meals: 3,
      water: true,
      steps: true,
    }));

    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ daysPerWeek: 3, checkIns }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].adherence30d).toBeLessThanOrEqual(100);
  });

  it("returns daysSinceCheckIn as null when no check-ins", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ checkIns: [] }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].daysSinceCheckIn).toBeNull();
    expect(data.clients[0].lastCheckIn).toBeNull();
  });

  it("computes daysSinceCheckIn correctly", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({
        checkIns: [{ date: daysAgo(2), workout: true, meals: 3, water: true, steps: true }],
      }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].daysSinceCheckIn).toBe(2);
  });
});

describe("getCoachDashboard — portfolio stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.application.findMany.mockResolvedValue([]);
  });

  it("returns zero counts when no members", async () => {
    mockPrisma.member.findMany.mockResolvedValue([]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const data = await getCoachDashboard();

    expect(data.portfolio.activeClients).toBe(0);
    expect(data.portfolio.atRiskCount).toBe(0);
    expect(data.portfolio.needsAttentionCount).toBe(0);
    expect(data.portfolio.averageAdherence7d).toBe(0);
  });

  it("counts atRisk and needsAttention correctly", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ id: "m1", email: "a@t.com", checkIns: [] }), // needs_attention (no check-ins)
      makeMember({
        id: "m2",
        email: "b@t.com",
        daysPerWeek: 1,
        checkIns: [{ date: daysAgo(8), workout: true, meals: 3, water: true, steps: true }],
      }), // at_risk (8 days since check-in)
      makeMember({
        id: "m3",
        email: "c@t.com",
        daysPerWeek: 1, // 1 workout target → 1 workout yesterday = 100% adherence
        checkIns: [{ date: daysAgo(1), workout: true, meals: 3, water: true, steps: true }],
      }), // on_track
    ]);
    mockPrisma.lead.count.mockResolvedValue(10);

    const data = await getCoachDashboard();

    expect(data.portfolio.activeClients).toBe(3);
    expect(data.portfolio.atRiskCount).toBe(1);
    expect(data.portfolio.needsAttentionCount).toBe(1);
    expect(data.portfolio.totalLeads).toBe(10);
  });

  it("sorts clients: at_risk first, then needs_attention, then on_track", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({
        id: "m1",
        email: "ontrack@t.com",
        daysPerWeek: 1, // 1 target → 1 recent workout = 100% adherence → on_track
        checkIns: [{ date: daysAgo(1), workout: true, meals: 3, water: true, steps: true }],
      }), // on_track
      makeMember({ id: "m2", email: "attention@t.com", checkIns: [] }), // needs_attention
      makeMember({
        id: "m3",
        email: "risk@t.com",
        daysPerWeek: 1,
        checkIns: [{ date: daysAgo(10), workout: true, meals: 3, water: true, steps: true }],
      }), // at_risk
    ]);
    mockPrisma.lead.count.mockResolvedValue(0);

    const data = await getCoachDashboard();

    expect(data.clients[0].status).toBe("at_risk");
    expect(data.clients[1].status).toBe("needs_attention");
    expect(data.clients[2].status).toBe("on_track");
  });
});

describe("getCoachDashboard — client data mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.lead.count.mockResolvedValue(0);
    mockPrisma.application.findMany.mockResolvedValue([]);
  });

  it("sets onboarded=true when onboardedAt is set", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ onboardedAt: new Date() }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].onboarded).toBe(true);
  });

  it("sets onboarded=false when onboardedAt is null", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ onboardedAt: null }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].onboarded).toBe(false);
  });

  it("includes activeProgram data when programBlocks has entries", async () => {
    const programBlock = {
      name: "Strength Phase 1",
      primaryGoal: "muscle",
      split: "upper_lower",
      daysPerWeek: 4,
      status: "active",
      nextUpdateDate: null,
    };

    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ programBlocks: [programBlock] }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].activeProgram).not.toBeNull();
    expect(data.clients[0].activeProgram!.name).toBe("Strength Phase 1");
  });

  it("sets activeProgram to null when no program blocks", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ programBlocks: [] }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].activeProgram).toBeNull();
  });

  it("includes activeMacro data when macroTargets has entries", async () => {
    const macroTarget = {
      calories: 2200,
      protein: 180,
      fatsMin: 60,
      carbs: 220,
      stepsTarget: 8000,
      effectiveDate: new Date("2026-03-01"),
    };

    mockPrisma.member.findMany.mockResolvedValue([
      makeMember({ macroTargets: [macroTarget] }),
    ]);

    const data = await getCoachDashboard();
    expect(data.clients[0].activeMacro).not.toBeNull();
    expect(data.clients[0].activeMacro!.calories).toBe(2200);
  });

  it("maps applications to dashboard data", async () => {
    const application = {
      id: "app_001",
      email: "applicant@test.com",
      fullName: "Test Person",
      phone: null,
      age: 28,
      height: "5'10\"",
      currentWeight: "185",
      goal: "fat_loss",
      whyNow: "New year motivation",
      trainingExperience: "intermediate",
      trainingFrequency: "3-4x/week",
      gymAccess: "yes",
      injuryHistory: null,
      nutritionStruggles: null,
      biggestObstacle: null,
      helpWithMost: null,
      preferredTier: "standard",
      readyForStructure: true,
      budgetComfort: "yes",
      status: "pending",
      createdAt: new Date(),
      approvedAt: null,
      convertedToMember: false,
    };

    mockPrisma.member.findMany.mockResolvedValue([]);
    mockPrisma.application.findMany.mockResolvedValue([application]);

    const data = await getCoachDashboard();
    expect(data.applications).toHaveLength(1);
    expect(data.applications[0].email).toBe("applicant@test.com");
    expect(data.applications[0].convertedToMember).toBe(false);
  });
});
