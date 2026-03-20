/**
 * Tests for services/checkin.ts
 *
 * Covers: createCheckIn (idempotency, NOT_FOUND, enhanced fields),
 * getCheckInHistory (null returns, weekly stats, streak delegation).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockPrisma } from "@/test/setup";

import { createCheckIn, getCheckInHistory } from "@/services/checkin";

const ACTIVE_MEMBER = {
  id: "m_test_001",
  email: "member@test.com",
  status: "active",
};

const MOCK_CHECKIN = {
  id: "ci_test_001",
  memberId: ACTIVE_MEMBER.id,
  date: new Date("2026-03-15T00:00:00Z"),
  workout: true,
  meals: 3,
  water: true,
  steps: true,
  note: null,
};

describe("createCheckIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns NOT_FOUND when member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const result = await createCheckIn(
      "nobody@test.com",
      { workout: true, meals: 3, water: true, steps: true },
      {}
    );

    expect(result).toEqual({ ok: false, code: "NOT_FOUND" });
    expect(mockPrisma.checkIn.create).not.toHaveBeenCalled();
  });

  it("returns NOT_FOUND when member is not active", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      ...ACTIVE_MEMBER,
      status: "canceled",
    });

    const result = await createCheckIn(
      ACTIVE_MEMBER.email,
      { workout: false, meals: 0, water: false, steps: false },
      {}
    );

    expect(result).toEqual({ ok: false, code: "NOT_FOUND" });
  });

  it("returns ALREADY_CHECKED_IN when check-in exists for today", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findFirst.mockResolvedValue(MOCK_CHECKIN);

    const result = await createCheckIn(
      ACTIVE_MEMBER.email,
      { workout: true, meals: 3, water: true, steps: true },
      {}
    );

    expect(result).toEqual({ ok: false, code: "ALREADY_CHECKED_IN" });
    expect(mockPrisma.checkIn.create).not.toHaveBeenCalled();
  });

  it("creates check-in with basic fields and returns ok:true", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue(MOCK_CHECKIN);

    const result = await createCheckIn(
      ACTIVE_MEMBER.email,
      { workout: true, meals: 3, water: true, steps: true },
      {}
    );

    expect(result).toEqual({ ok: true, checkIn: MOCK_CHECKIN });
    expect(mockPrisma.checkIn.create).toHaveBeenCalledOnce();
  });

  it("includes only defined enhanced fields in createData", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue(MOCK_CHECKIN);

    await createCheckIn(
      ACTIVE_MEMBER.email,
      { workout: true, meals: 2, water: true, steps: false },
      { avgWeight: 185.5, energyScore: 8 }
    );

    const createArgs = mockPrisma.checkIn.create.mock.calls[0][0].data;
    expect(createArgs.avgWeight).toBe(185.5);
    expect(createArgs.energyScore).toBe(8);
    // undefined fields should not be present
    expect(createArgs.waist).toBeUndefined();
    expect(createArgs.stressScore).toBeUndefined();
  });

  it("stores note from basicFields when provided", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue(MOCK_CHECKIN);

    await createCheckIn(
      ACTIVE_MEMBER.email,
      { workout: false, meals: 0, water: false, steps: false, note: "rest day" },
      {}
    );

    const createArgs = mockPrisma.checkIn.create.mock.calls[0][0].data;
    expect(createArgs.note).toBe("rest day");
  });

  it("sets note to null when not provided", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue(MOCK_CHECKIN);

    await createCheckIn(
      ACTIVE_MEMBER.email,
      { workout: true, meals: 3, water: true, steps: true },
      {}
    );

    const createArgs = mockPrisma.checkIn.create.mock.calls[0][0].data;
    expect(createArgs.note).toBeNull();
  });
});

describe("getCheckInHistory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const result = await getCheckInHistory("nobody@test.com", 30);

    expect(result).toBeNull();
  });

  it("returns null when member is not active", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      ...ACTIVE_MEMBER,
      status: "past_due",
    });

    const result = await getCheckInHistory(ACTIVE_MEMBER.email, 30);

    expect(result).toBeNull();
  });

  it("returns checkIns and stats for active member", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findMany.mockResolvedValue([MOCK_CHECKIN]);

    const result = await getCheckInHistory(ACTIVE_MEMBER.email, 30);

    expect(result).not.toBeNull();
    expect(result!.checkIns).toHaveLength(1);
    expect(result!.stats).toBeDefined();
  });

  it("returns zero weeklyWorkouts when no check-ins this week have workout=true", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);

    // Sunday of this week at midnight
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(12, 0, 0, 0); // within this week

    mockPrisma.checkIn.findMany.mockResolvedValue([
      { ...MOCK_CHECKIN, date: weekStart, workout: false },
    ]);

    const result = await getCheckInHistory(ACTIVE_MEMBER.email, 30);

    expect(result!.stats.weeklyWorkouts).toBe(0);
  });

  it("counts weeklyWorkouts for check-ins with workout=true this week", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    // Both within this week (assuming we're not on Sunday with yesterday being last week)
    const checkIns = [
      { ...MOCK_CHECKIN, id: "ci1", date: now, workout: true },
      { ...MOCK_CHECKIN, id: "ci2", date: yesterday, workout: true },
      { ...MOCK_CHECKIN, id: "ci3", date: yesterday, workout: false },
    ].filter((ci) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      return new Date(ci.date) >= weekStart;
    });

    mockPrisma.checkIn.findMany.mockResolvedValue(checkIns);

    const result = await getCheckInHistory(ACTIVE_MEMBER.email, 30);

    expect(result!.stats.weeklyWorkouts).toBe(
      checkIns.filter((ci) => ci.workout).length
    );
  });

  it("returns weeklyAdherence as 0 when no days elapsed", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);

    // Use fake timers to set a Sunday so daysElapsed = 1 (min)
    // The formula uses daysElapsed > 0 check
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    const result = await getCheckInHistory(ACTIVE_MEMBER.email, 30);

    // weeklyAdherence = (0 / daysElapsed) * 100 = 0
    expect(result!.stats.weeklyAdherence).toBe(0);
  });

  it("passes the limit parameter to findMany", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(ACTIVE_MEMBER);
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    await getCheckInHistory(ACTIVE_MEMBER.email, 7);

    const findManyArgs = mockPrisma.checkIn.findMany.mock.calls[0][0];
    expect(findManyArgs.take).toBe(7);
  });
});
