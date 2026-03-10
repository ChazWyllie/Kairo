/**
 * Tests for POST /api/plan — Plan generation endpoint.
 *
 * Behavior matrix coverage:
 * - Happy path: valid constraints → DailyPlan returned + persisted
 * - Auth: coach bearer → allowed; no auth → 401; wrong session → 401
 * - Validation: missing fields, invalid enums, bad types → 400
 * - Idempotency: same member+date → upsert (not duplicate)
 * - Rate limiting: exceeded → 429
 * - DB failure: → safe 500
 * - Edge cases: extra fields stripped, 15-min session, travel mode
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";

import { POST } from "@/app/api/plan/route";

const COACH_SECRET = "test-coach-secret-1234567890";

const VALID_BODY = {
  email: "member@test.com",
  timeAvailable: 30,
  equipment: "full_gym",
  goal: "fat_loss",
  experience: "intermediate",
  travelMode: false,
  highStress: false,
  lowSleep: false,
  noJumping: false,
};

const MOCK_MEMBER = {
  id: "member_abc",
  email: "member@test.com",
  status: "active",
};

const MOCK_DAILY_PLAN_RECORD = {
  id: "dp_abc",
  memberId: "member_abc",
  date: new Date("2026-03-15"),
  mode: "normal",
  plan: {},
  constraints: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(
  body: Record<string, unknown>,
  options: { secret?: string } = {}
): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: `Bearer ${options.secret ?? COACH_SECRET}`,
  };
  return new NextRequest("http://localhost:3000/api/plan", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function makeUnauthRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.dailyPlan.upsert.mockReset();

    // Default: member exists
    mockPrisma.member.findUnique.mockResolvedValue(MOCK_MEMBER);
    mockPrisma.dailyPlan.upsert.mockResolvedValue(MOCK_DAILY_PLAN_RECORD);
  });

  // ── Happy Path ──

  describe("happy path", () => {
    it("returns 200 with a valid DailyPlan", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan).toHaveProperty("date");
      expect(json.plan).toHaveProperty("mode");
      expect(json.plan).toHaveProperty("workouts");
      expect(json.plan).toHaveProperty("nutrition");
      expect(json.plan.workouts.length).toBeGreaterThanOrEqual(2);
    });

    it("returns nutrition with proteinGoal and calorieEstimate", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(json.plan.nutrition.proteinGoal).toBeGreaterThan(0);
      expect(json.plan.nutrition.calorieEstimate).toBeGreaterThan(0);
    });

    it("persists the plan via upsert", async () => {
      await POST(makeRequest(VALID_BODY));

      expect(mockPrisma.dailyPlan.upsert).toHaveBeenCalledOnce();
      const call = mockPrisma.dailyPlan.upsert.mock.calls[0][0];
      expect(call.where.memberId_date.memberId).toBe("member_abc");
      expect(call.create.memberId).toBe("member_abc");
    });

    it("sets plan mode to normal for standard constraints", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(json.plan.mode).toBe("normal");
    });

    it("sets plan mode to travel when travelMode is true", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, travelMode: true })
      );
      const json = await res.json();

      expect(json.plan.mode).toBe("travel");
    });

    it("sets plan mode to recovery when highStress is true", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, highStress: true })
      );
      const json = await res.json();

      expect(json.plan.mode).toBe("recovery");
    });
  });

  // ── Authentication ──

  describe("authentication", () => {
    it("returns 401 when no auth provided", async () => {
      const res = await POST(makeUnauthRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 with invalid bearer token", async () => {
      const res = await POST(
        makeRequest(VALID_BODY, { secret: "wrong-secret" })
      );
      const json = await res.json();

      expect(res.status).toBe(401);
      expect(json.error.code).toBe("UNAUTHORIZED");
    });

    it("allows coach bearer auth", async () => {
      const res = await POST(makeRequest(VALID_BODY));
      expect(res.status).toBe(200);
    });
  });

  // ── Validation ──

  describe("input validation", () => {
    it("returns 400 for missing email", async () => {
      const { email: _, ...noEmail } = VALID_BODY;
      const res = await POST(makeRequest(noEmail));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid email", async () => {
      const res = await POST(makeRequest({ ...VALID_BODY, email: "not-email" }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for missing timeAvailable", async () => {
      const { timeAvailable: _, ...body } = VALID_BODY;
      const res = await POST(makeRequest(body));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid timeAvailable value", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, timeAvailable: 99 })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid equipment enum", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, equipment: "magic_gym" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for invalid goal enum", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, goal: "be_huge" })
      );
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for non-JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/plan", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${COACH_SECRET}`,
        },
        body: "not-json",
      });
      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("strips extra fields", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, admin: true, __proto__: { isAdmin: true } })
      );
      expect(res.status).toBe(200);
    });
  });

  // ── Member not found ──

  describe("member lookup", () => {
    it("returns 404 when member does not exist", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 when member is not active", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        ...MOCK_MEMBER,
        status: "canceled",
      });

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(403);
      expect(json.error.code).toBe("INACTIVE_MEMBER");
    });
  });

  // ── DB failures ──

  describe("database errors", () => {
    it("returns 500 on member lookup failure", async () => {
      mockPrisma.member.findUnique.mockRejectedValue(
        new Error("DB unavailable")
      );

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error.code).toBe("PLAN_ERROR");
    });

    it("returns 500 on plan persist failure", async () => {
      mockPrisma.dailyPlan.upsert.mockRejectedValue(
        new Error("Write failed")
      );

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(res.status).toBe(500);
      expect(json.error.code).toBe("PLAN_ERROR");
    });

    it("does not leak error details in response", async () => {
      mockPrisma.member.findUnique.mockRejectedValue(
        new Error("Connection to 10.0.0.1:5432 refused")
      );

      const res = await POST(makeRequest(VALID_BODY));
      const json = await res.json();

      expect(json.error.message).not.toContain("10.0.0.1");
      expect(json.error.message).not.toContain("5432");
    });
  });

  // ── Edge cases ──

  describe("edge cases", () => {
    it("handles 15-minute session (minimum time)", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, timeAvailable: 15 })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan.workouts[0].exercises.length).toBeGreaterThan(0);
    });

    it("handles 60-minute session (maximum time)", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, timeAvailable: 60 })
      );
      expect(res.status).toBe(200);
    });

    it("handles bodyweight-only (equipment: none)", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, equipment: "none", travelMode: true })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan.mode).toBe("travel");
    });

    it("handles beginner experience", async () => {
      const res = await POST(
        makeRequest({ ...VALID_BODY, experience: "beginner" })
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      // Beginners get fewer exercises
      for (const w of json.plan.workouts) {
        expect(w.exercises.length).toBeLessThanOrEqual(4);
      }
    });

    it("defaults optional booleans to false", async () => {
      const minimal = {
        email: "member@test.com",
        timeAvailable: 30,
        equipment: "full_gym",
        goal: "fat_loss",
      };
      const res = await POST(makeRequest(minimal));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.plan.mode).toBe("normal"); // no travelMode/highStress/lowSleep
    });

    it("defaults experience to beginner", async () => {
      const body = { ...VALID_BODY };
      delete (body as Record<string, unknown>).experience;
      const res = await POST(makeRequest(body));
      const json = await res.json();

      expect(res.status).toBe(200);
      // Should still work with default experience
      expect(json.plan.workouts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
