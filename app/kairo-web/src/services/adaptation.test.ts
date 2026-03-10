/**
 * Tests for adaptation service — integration with Prisma mocks.
 *
 * Coverage:
 * - runAdaptation with sufficient data → recommendations + insights
 * - runAdaptation with insufficient data → INSUFFICIENT_DATA error
 * - runAdaptation with inactive member → INSUFFICIENT_DATA error
 * - runAdaptation with no member → INSUFFICIENT_DATA error
 * - Goal mapping: free-text → typed goal
 * - Macro target loading
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";
import { runAdaptation } from "./adaptation";

// ── Helpers ──

function makeMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "member-1",
    email: "test@example.com",
    status: "active",
    goal: "fat loss",
    daysPerWeek: 4,
    ...overrides,
  };
}

function makeCheckIn(dayOffset: number, overrides: Record<string, unknown> = {}) {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  date.setHours(0, 0, 0, 0);
  return {
    id: `ci-${dayOffset}`,
    memberId: "member-1",
    date,
    workout: true,
    meals: 3,
    water: true,
    steps: true,
    avgWeight: null,
    waist: null,
    workoutsCompleted: 4,
    stepsAverage: 8000,
    calorieAdherence: 7,
    proteinAdherence: 7,
    sleepAverage: 7.5,
    energyScore: 7,
    hungerScore: 5,
    stressScore: 4,
    recoveryScore: 7,
    photoSubmitted: false,
    frontPhotoUrl: null,
    sidePhotoUrl: null,
    backPhotoUrl: null,
    digestionScore: null,
    painNotes: null,
    biggestWin: null,
    biggestStruggle: null,
    helpNeeded: null,
    note: null,
    coachStatus: "green",
    coachResponse: null,
    createdAt: date,
    updatedAt: date,
    ...overrides,
  };
}

beforeEach(() => {
  Object.values(mockPrisma).forEach((model) => {
    Object.values(model).forEach((fn) => {
      if (typeof fn === "function" && "mockReset" in fn) {
        (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset();
      }
    });
  });
});

// ────────────────────────────────────────────────
//  Happy path
// ────────────────────────────────────────────────

describe("runAdaptation — happy path", () => {
  it("returns recommendations and insights with sufficient data", async () => {
    const member = makeMember();
    mockPrisma.member.findUnique.mockResolvedValue(member);
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 90 }),
      makeCheckIn(14, { avgWeight: 89.5 }),
      makeCheckIn(7, { avgWeight: 89 }),
      makeCheckIn(0, { avgWeight: 88.5 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue({
      id: "mt-1",
      memberId: "member-1",
      calories: 2200,
      protein: 160,
      active: true,
    });

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
      expect(result.insights.weight.direction).toBe("losing");
      expect(result.insights.weight.dataPoints).toBe(4);
      expect(result.insights.adherence).toBeDefined();
      expect(result.insights.recovery).toBeDefined();
    }
  });

  it("returns maintain_course when fat loss client is losing weight", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember({ goal: "fat loss" }));
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 90 }),
      makeCheckIn(14, { avgWeight: 89 }),
      makeCheckIn(7, { avgWeight: 88 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue(null);

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      const actions = result.recommendations.map((r) => r.action);
      expect(actions).toContain("maintain_course");
    }
  });

  it("loads macro target for calorie context", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember());
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21),
      makeCheckIn(14),
      makeCheckIn(7),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue({
      id: "mt-1",
      calories: 2500,
      protein: 180,
      status: "active",
    });

    await runAdaptation("test@example.com");

    expect(mockPrisma.macroTarget.findFirst).toHaveBeenCalledWith({
      where: { memberId: "member-1", status: "active" },
      orderBy: { createdAt: "desc" },
    });
  });
});

// ────────────────────────────────────────────────
//  Insufficient data
// ────────────────────────────────────────────────

describe("runAdaptation — insufficient data", () => {
  it("returns INSUFFICIENT_DATA when fewer than 3 check-ins", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember());
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(7),
      makeCheckIn(0),
    ]);

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INSUFFICIENT_DATA");
      expect(result.message).toContain("3");
    }
  });

  it("returns INSUFFICIENT_DATA when no check-ins exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember());
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INSUFFICIENT_DATA");
    }
  });
});

// ────────────────────────────────────────────────
//  Member not found / inactive
// ────────────────────────────────────────────────

describe("runAdaptation — member validation", () => {
  it("returns INSUFFICIENT_DATA when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const result = await runAdaptation("unknown@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INSUFFICIENT_DATA");
    }
  });

  it("returns INSUFFICIENT_DATA for inactive member", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(
      makeMember({ status: "churned" })
    );

    const result = await runAdaptation("churned@example.com");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("INSUFFICIENT_DATA");
    }
  });
});

// ────────────────────────────────────────────────
//  Goal mapping
// ────────────────────────────────────────────────

describe("runAdaptation — goal mapping", () => {
  it("maps 'fat loss' to fat_loss goal", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember({ goal: "fat loss" }));
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 90 }),
      makeCheckIn(14, { avgWeight: 90 }),
      makeCheckIn(7, { avgWeight: 90 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue(null);

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Stable weight + fat_loss → should recommend reduce_calories
      const actions = result.recommendations.map((r) => r.action);
      expect(actions).toContain("reduce_calories");
    }
  });

  it("maps 'muscle gain' to muscle goal", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember({ goal: "muscle gain" }));
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 80 }),
      makeCheckIn(14, { avgWeight: 80 }),
      makeCheckIn(7, { avgWeight: 80 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue(null);

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Stable weight + muscle → should recommend increase_calories
      const actions = result.recommendations.map((r) => r.action);
      expect(actions).toContain("increase_calories");
    }
  });

  it("defaults to maintenance for null goal", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember({ goal: null }));
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 85 }),
      makeCheckIn(14, { avgWeight: 85 }),
      makeCheckIn(7, { avgWeight: 85 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue(null);

    const result = await runAdaptation("test@example.com");

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Stable weight + maintenance → maintain_course
      const actions = result.recommendations.map((r) => r.action);
      expect(actions).toContain("maintain_course");
    }
  });
});
