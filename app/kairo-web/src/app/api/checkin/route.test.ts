/**
 * Tests for POST /api/checkin
 *
 * Creates a daily check-in for an active member.
 * FR-8: Quick Logging — checklist UI: workout, meals, water, steps
 * "I missed" button with optional reason. Completion ≤ 30s.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";

const { POST } = await import("./route");

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/checkin", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.checkIn.create.mockReset();
    mockPrisma.checkIn.findFirst.mockReset();
  });

  // ── Validation ──

  it("returns 400 if email is missing", async () => {
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 if email is invalid", async () => {
    const res = await POST(makeRequest({ email: "bad" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 if meals exceeds 3", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", meals: 4 }) as never
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 if meals is negative", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", meals: -1 }) as never
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 if note exceeds 500 chars", async () => {
    const res = await POST(
      makeRequest({ email: "a@b.com", note: "x".repeat(501) }) as never
    );
    expect(res.status).toBe(400);
  });

  // ── Not found / not active ──

  it("returns 404 if member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await POST(
      makeRequest({ email: "nobody@test.com" }) as never
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 404 if member is not active", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "canceled@test.com",
      status: "canceled",
    });
    const res = await POST(
      makeRequest({ email: "canceled@test.com" }) as never
    );
    expect(res.status).toBe(404);
  });

  // ── Duplicate ──

  it("returns 409 if already checked in today", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "a@b.com",
      status: "active",
    });
    mockPrisma.checkIn.findFirst.mockResolvedValue({
      id: "existing",
      date: new Date(),
    });

    const res = await POST(makeRequest({ email: "a@b.com" }) as never);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error.code).toBe("ALREADY_CHECKED_IN");
  });

  // ── Happy path ──

  it("creates check-in with all fields", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "user@test.com",
      status: "active",
    });
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue({
      id: "ci_1",
      memberId: "m1",
      date: new Date("2026-03-07"),
      workout: true,
      meals: 3,
      water: true,
      steps: true,
      note: null,
    });

    const res = await POST(
      makeRequest({
        email: "user@test.com",
        workout: true,
        meals: 3,
        water: true,
        steps: true,
      }) as never
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.checkIn.workout).toBe(true);
    expect(body.checkIn.meals).toBe(3);
    expect(mockPrisma.checkIn.create).toHaveBeenCalledOnce();
  });

  it("creates check-in with defaults (all false/0)", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "user@test.com",
      status: "active",
    });
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue({
      id: "ci_2",
      memberId: "m1",
      date: new Date("2026-03-07"),
      workout: false,
      meals: 0,
      water: false,
      steps: false,
      note: "Felt sick today",
    });

    const res = await POST(
      makeRequest({
        email: "user@test.com",
        note: "Felt sick today",
      }) as never
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.checkIn.workout).toBe(false);
    expect(body.checkIn.note).toBe("Felt sick today");
  });

  it("does not return memberId in response", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "user@test.com",
      status: "active",
    });
    mockPrisma.checkIn.findFirst.mockResolvedValue(null);
    mockPrisma.checkIn.create.mockResolvedValue({
      id: "ci_3",
      memberId: "m1",
      date: new Date(),
      workout: true,
      meals: 2,
      water: true,
      steps: false,
      note: null,
    });

    const res = await POST(
      makeRequest({ email: "user@test.com", workout: true }) as never
    );
    const body = await res.json();
    expect(body.checkIn.memberId).toBeUndefined();
  });
});
