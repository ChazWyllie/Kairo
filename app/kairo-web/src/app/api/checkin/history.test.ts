/**
 * Tests for GET /api/checkin
 *
 * Fetch check-in history for an active member.
 * Returns: recent check-ins, streak count, weekly adherence.
 * FR-10: Insights — streak, weekly adherence, workouts this week.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";

const { GET } = await import("./route");

const COACH_SECRET = "test-coach-secret-1234567890";

function makeRequest(url: string, secret?: string) {
  const headers: Record<string, string> = {};
  if (secret !== "") {
    headers["authorization"] = `Bearer ${secret ?? COACH_SECRET}`;
  }
  return new Request(url, { method: "GET", headers });
}

describe("GET /api/checkin", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.checkIn.findMany.mockReset();
    mockPrisma.checkIn.count.mockReset();
  });

  // ── Validation ──

  it("returns 400 if email query param is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/checkin");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 if email is invalid", async () => {
    const req = makeRequest("http://localhost:3000/api/checkin?email=bad");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
  });

  // ── Not found ──

  it("returns 404 if member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/checkin?email=nobody@test.com");
    const res = await GET(req as never);
    expect(res.status).toBe(404);
  });

  it("returns 404 if member is not active", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "x@y.com",
      status: "pending",
    });
    const req = makeRequest("http://localhost:3000/api/checkin?email=x@y.com");
    const res = await GET(req as never);
    expect(res.status).toBe(404);
  });

  // ── Happy path ──

  it("returns check-in history with streak and stats", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "user@test.com",
      status: "active",
    });

    // Recent check-ins (last 30 days)
    mockPrisma.checkIn.findMany.mockResolvedValue([
      {
        id: "ci1",
        date: new Date("2026-03-07"),
        workout: true,
        meals: 3,
        water: true,
        steps: true,
        note: null,
        createdAt: new Date(),
      },
      {
        id: "ci2",
        date: new Date("2026-03-06"),
        workout: true,
        meals: 2,
        water: true,
        steps: false,
        note: null,
        createdAt: new Date(),
      },
    ]);

    const req = makeRequest("http://localhost:3000/api/checkin?email=user@test.com");
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.checkIns).toHaveLength(2);
    expect(body.stats.currentStreak).toBeGreaterThanOrEqual(0);
    expect(body.stats.weeklyWorkouts).toBeGreaterThanOrEqual(0);
    expect(typeof body.stats.weeklyAdherence).toBe("number");
  });

  it("returns empty history for member with no check-ins", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "new@test.com",
      status: "active",
    });
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    const req = makeRequest("http://localhost:3000/api/checkin?email=new@test.com");
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.checkIns).toHaveLength(0);
    expect(body.stats.currentStreak).toBe(0);
    expect(body.stats.weeklyWorkouts).toBe(0);
    expect(body.stats.weeklyAdherence).toBe(0);
  });

  it("limits results with limit query param", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "user@test.com",
      status: "active",
    });
    mockPrisma.checkIn.findMany.mockResolvedValue([
      { id: "ci1", date: new Date(), workout: true, meals: 1, water: true, steps: true, note: null, createdAt: new Date() },
    ]);

    const req = makeRequest("http://localhost:3000/api/checkin?email=user@test.com&limit=1");
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    // Verify findMany was called with take
    expect(mockPrisma.checkIn.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 1 })
    );
  });

  it("does not expose memberId in check-in records", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "user@test.com",
      status: "active",
    });
    mockPrisma.checkIn.findMany.mockResolvedValue([
      {
        id: "ci1",
        memberId: "m1",
        date: new Date("2026-03-07"),
        workout: true,
        meals: 1,
        water: false,
        steps: false,
        note: null,
        createdAt: new Date(),
      },
    ]);

    const req = makeRequest("http://localhost:3000/api/checkin?email=user@test.com");
    const res = await GET(req as never);
    const body = await res.json();
    expect(body.checkIns[0].memberId).toBeUndefined();
  });
});
