/**
 * Tests for /api/program
 *
 * POST  — create a program block (coach secret required)
 * GET   — get program blocks by member email (public)
 * PATCH — update a program block (coach secret required)
 *
 * All external calls mocked — no real DB.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { POST, GET, PATCH } from "@/app/api/program/route";

const COACH_SECRET = "test-coach-secret-1234567890";

function makePostRequest(
  body: Record<string, unknown>,
  secret?: string
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/program", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function makeGetRequest(email: string, secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret !== "") {
    headers["authorization"] = `Bearer ${secret ?? COACH_SECRET}`;
  }
  return new NextRequest(
    `http://localhost:3000/api/program?email=${encodeURIComponent(email)}`,
    { method: "GET", headers }
  );
}

function makePatchRequest(
  body: Record<string, unknown>,
  secret?: string
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/program", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

// ── POST ──

describe("POST /api/program", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.programBlock.create.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await POST(
      makePostRequest({ email: "a@b.com", name: "Block A", startDate: "2025-01-01T00:00:00.000Z" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong coach secret", async () => {
    const res = await POST(
      makePostRequest(
        { email: "a@b.com", name: "Block A", startDate: "2025-01-01T00:00:00.000Z" },
        "wrong-secret"
      )
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing name", async () => {
    const res = await POST(
      makePostRequest(
        { email: "a@b.com", startDate: "2025-01-01T00:00:00.000Z" },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing startDate", async () => {
    const res = await POST(
      makePostRequest({ email: "a@b.com", name: "Block A" }, COACH_SECRET)
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid primaryGoal", async () => {
    const res = await POST(
      makePostRequest(
        {
          email: "a@b.com",
          name: "Block A",
          startDate: "2025-01-01T00:00:00.000Z",
          primaryGoal: "invalid_goal",
        },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await POST(
      makePostRequest(
        { email: "nobody@test.com", name: "Block A", startDate: "2025-01-01T00:00:00.000Z" },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(404);
  });

  it("creates a program block and returns 201", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.programBlock.create.mockResolvedValue({
      id: "pb1",
      memberId: "m1",
      name: "Hypertrophy Block 1",
      status: "active",
      startDate: new Date("2025-01-01"),
      endDate: null,
      primaryGoal: "hypertrophy",
      split: "upper_lower",
      daysPerWeek: 4,
      progressionModel: "double progression",
      deloadPlanned: true,
      deloadWeek: 4,
      keyExercises: "squat,bench,deadlift",
      workoutNotes: null,
      cardioTarget: "3x30min LISS",
      stepsTarget: 10000,
      nextUpdateDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(
      makePostRequest(
        {
          email: "client@test.com",
          name: "Hypertrophy Block 1",
          startDate: "2025-01-01T00:00:00.000Z",
          primaryGoal: "hypertrophy",
          split: "upper_lower",
          daysPerWeek: 4,
          progressionModel: "double progression",
          deloadPlanned: true,
          deloadWeek: 4,
          keyExercises: "squat,bench,deadlift",
          cardioTarget: "3x30min LISS",
          stepsTarget: 10000,
        },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.program.id).toBe("pb1");
    expect(json.program.name).toBe("Hypertrophy Block 1");
    expect(json.program.primaryGoal).toBe("hypertrophy");
    expect(json.program.split).toBe("upper_lower");
    expect(json.program.daysPerWeek).toBe(4);
    expect(json.program.deloadPlanned).toBe(true);
    expect(json.program.stepsTarget).toBe(10000);
    expect(mockPrisma.programBlock.create).toHaveBeenCalledOnce();
  });

  it("creates a minimal program block with only required fields", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.programBlock.create.mockResolvedValue({
      id: "pb2",
      memberId: "m1",
      name: "Fat Loss Phase",
      status: "active",
      startDate: new Date("2025-02-01"),
      endDate: null,
      primaryGoal: null,
      split: null,
      daysPerWeek: null,
      progressionModel: null,
      deloadPlanned: false,
      deloadWeek: null,
      keyExercises: null,
      workoutNotes: null,
      cardioTarget: null,
      stepsTarget: null,
      nextUpdateDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(
      makePostRequest(
        { email: "client@test.com", name: "Fat Loss Phase", startDate: "2025-02-01T00:00:00.000Z" },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.program.name).toBe("Fat Loss Phase");
    expect(json.program.primaryGoal).toBeNull();
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.programBlock.create.mockRejectedValue(new Error("DB error"));

    const res = await POST(
      makePostRequest(
        { email: "client@test.com", name: "Block X", startDate: "2025-01-01T00:00:00.000Z" },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("PROGRAM_ERROR");
  });
});

// ── GET ──

describe("GET /api/program", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.programBlock.findMany.mockReset();
  });

  it("returns 401 without authentication", async () => {
    const res = await GET(makeGetRequest("a@b.com", ""));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 without email param", async () => {
    const req = new NextRequest("http://localhost:3000/api/program", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await GET(makeGetRequest("nobody@test.com"));
    expect(res.status).toBe(404);
  });

  it("returns program blocks for a member", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.programBlock.findMany.mockResolvedValue([
      {
        id: "pb1",
        name: "Hypertrophy Block 1",
        status: "active",
        startDate: new Date("2025-01-01"),
        endDate: null,
        primaryGoal: "hypertrophy",
        split: "upper_lower",
        daysPerWeek: 4,
        progressionModel: "double progression",
        deloadPlanned: true,
        deloadWeek: 4,
        keyExercises: "squat,bench,deadlift",
        workoutNotes: "Focus on compound movements",
        cardioTarget: "3x30min LISS",
        stepsTarget: 10000,
        adjustmentsMade: null,
        adjustmentReason: null,
        nextUpdateDate: null,
        createdAt: new Date("2025-01-01"),
      },
    ]);

    const res = await GET(makeGetRequest("client@test.com"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.programs).toHaveLength(1);
    expect(json.programs[0].name).toBe("Hypertrophy Block 1");
    expect(json.programs[0].adjustmentsMade).toBeNull();
  });

  it("returns empty array when member has no programs", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m2", email: "new@test.com" });
    mockPrisma.programBlock.findMany.mockResolvedValue([]);

    const res = await GET(makeGetRequest("new@test.com"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.programs).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.programBlock.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeGetRequest("client@test.com"));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("PROGRAM_ERROR");
  });
});

// ── PATCH ──

describe("PATCH /api/program", () => {
  beforeEach(() => {
    mockPrisma.programBlock.findUnique.mockReset();
    mockPrisma.programBlock.update.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await PATCH(makePatchRequest({ programId: "pb1", status: "completed" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong coach secret", async () => {
    const res = await PATCH(
      makePatchRequest({ programId: "pb1", status: "completed" }, "wrong-secret")
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing programId", async () => {
    const res = await PATCH(
      makePatchRequest({ status: "completed" }, COACH_SECRET)
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when program not found", async () => {
    mockPrisma.programBlock.findUnique.mockResolvedValue(null);
    const res = await PATCH(
      makePatchRequest({ programId: "nonexistent", status: "completed" }, COACH_SECRET)
    );
    expect(res.status).toBe(404);
  });

  it("updates program block status and adjustments", async () => {
    mockPrisma.programBlock.findUnique.mockResolvedValue({
      id: "pb1",
      name: "Block A",
      status: "active",
    });
    mockPrisma.programBlock.update.mockResolvedValue({ id: "pb1" });

    const res = await PATCH(
      makePatchRequest(
        {
          programId: "pb1",
          status: "completed",
          adjustmentsMade: "Swapped barbell row for cable row",
          adjustmentReason: "Client reported low back pain",
        },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(mockPrisma.programBlock.update).toHaveBeenCalledWith({
      where: { id: "pb1" },
      data: expect.objectContaining({
        status: "completed",
        adjustmentsMade: "Swapped barbell row for cable row",
        adjustmentReason: "Client reported low back pain",
      }),
    });
  });

  it("updates individual fields without touching others", async () => {
    mockPrisma.programBlock.findUnique.mockResolvedValue({
      id: "pb1",
      name: "Block A",
      status: "active",
    });
    mockPrisma.programBlock.update.mockResolvedValue({ id: "pb1" });

    const res = await PATCH(
      makePatchRequest(
        { programId: "pb1", daysPerWeek: 5 },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.programBlock.update).toHaveBeenCalledWith({
      where: { id: "pb1" },
      data: { daysPerWeek: 5 },
    });
  });

  it("returns 500 on database error", async () => {
    mockPrisma.programBlock.findUnique.mockResolvedValue({ id: "pb1" });
    mockPrisma.programBlock.update.mockRejectedValue(new Error("DB error"));

    const res = await PATCH(
      makePatchRequest({ programId: "pb1", status: "completed" }, COACH_SECRET)
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("PROGRAM_ERROR");
  });
});
