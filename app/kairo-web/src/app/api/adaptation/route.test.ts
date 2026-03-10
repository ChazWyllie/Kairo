/**
 * Tests for GET /api/adaptation
 *
 * Returns adaptation recommendations and insights for a member.
 * Requires auth and at least 3 check-ins in last 28 days.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";

const { GET } = await import("./route");

const COACH_SECRET = "test-coach-secret-1234567890";

function makeGetRequest(email: string | null, secret?: string) {
  const url = email
    ? `http://localhost:3000/api/adaptation?email=${encodeURIComponent(email)}`
    : "http://localhost:3000/api/adaptation";
  const headers: Record<string, string> = {};
  if (secret !== "") {
    headers["authorization"] = `Bearer ${secret ?? COACH_SECRET}`;
  }
  return new Request(url, { method: "GET", headers });
}

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

describe("GET /api/adaptation", () => {
  beforeEach(() => {
    Object.values(mockPrisma).forEach((model) => {
      Object.values(model).forEach((fn) => {
        if (typeof fn === "function" && "mockReset" in fn) {
          (fn as ReturnType<typeof import("vitest").vi.fn>).mockReset();
        }
      });
    });
  });

  // ── Auth ──

  it("returns 401 without authentication", async () => {
    const res = await GET(makeGetRequest("test@example.com", "") as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  // ── Validation ──

  it("returns 400 without email parameter", async () => {
    const res = await GET(makeGetRequest(null) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 with invalid email", async () => {
    const res = await GET(makeGetRequest("bad-email") as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  // ── Not found ──

  it("returns 422 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const res = await GET(makeGetRequest("unknown@example.com") as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("INSUFFICIENT_DATA");
  });

  // ── Insufficient data ──

  it("returns 422 when fewer than 3 check-ins", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember());
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(7),
      makeCheckIn(0),
    ]);

    const res = await GET(makeGetRequest("test@example.com") as never);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe("INSUFFICIENT_DATA");
  });

  // ── Happy path ──

  it("returns recommendations and insights with sufficient data", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember());
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

    const res = await GET(makeGetRequest("test@example.com") as never);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.recommendations).toBeDefined();
    expect(Array.isArray(body.recommendations)).toBe(true);
    expect(body.recommendations.length).toBeGreaterThanOrEqual(1);

    expect(body.insights).toBeDefined();
    expect(body.insights.weight).toBeDefined();
    expect(body.insights.adherence).toBeDefined();
    expect(body.insights.recovery).toBeDefined();
  });

  it("returns maintain_course for fat loss client losing weight", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember({ goal: "fat loss" }));
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 90 }),
      makeCheckIn(14, { avgWeight: 89 }),
      makeCheckIn(7, { avgWeight: 88 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue(null);

    const res = await GET(makeGetRequest("test@example.com") as never);
    expect(res.status).toBe(200);
    const body = await res.json();

    const actions = body.recommendations.map((r: { action: string }) => r.action);
    expect(actions).toContain("maintain_course");
  });

  it("includes weight direction in insights", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(makeMember());
    mockPrisma.checkIn.findMany.mockResolvedValue([
      makeCheckIn(21, { avgWeight: 85 }),
      makeCheckIn(14, { avgWeight: 85 }),
      makeCheckIn(7, { avgWeight: 85 }),
    ]);
    mockPrisma.macroTarget.findFirst.mockResolvedValue(null);

    const res = await GET(makeGetRequest("test@example.com") as never);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.insights.weight.direction).toBe("stable");
  });
});
