/**
 * Tests for POST /api/onboarding
 *
 * Coverage: Zod validation, active-member gate, successful save,
 * field persistence, edge cases.
 * All external calls mocked — no real DB.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { POST } from "@/app/api/onboarding/route";

const COACH_SECRET = "test-coach-secret-1234567890";

function makeOnboardingRequest(body: Record<string, unknown>, secret?: string): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret !== "") {
    headers["authorization"] = `Bearer ${secret ?? COACH_SECRET}`;
  }
  return new NextRequest("http://localhost:3000/api/onboarding", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
  });

  // ── Auth ──

  it("returns 401 without authentication", async () => {
    const response = await POST(
      makeOnboardingRequest({ email: "test@test.com" }, "")
    );
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error.code).toBe("UNAUTHORIZED");
  });

  // ── Validation ──

  describe("validation", () => {
    it("returns 400 when email is missing", async () => {
      const response = await POST(
        makeOnboardingRequest({ goal: "fat_loss" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when email is invalid", async () => {
      const response = await POST(
        makeOnboardingRequest({ email: "not-an-email" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when goal is not a valid enum", async () => {
      const response = await POST(
        makeOnboardingRequest({ email: "test@test.com", goal: "bulk_up" })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when daysPerWeek is out of range", async () => {
      const response = await POST(
        makeOnboardingRequest({ email: "test@test.com", daysPerWeek: 8 })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when minutesPerSession is not a valid option", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "test@test.com",
          minutesPerSession: 25,
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when injuries exceed 500 characters", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "test@test.com",
          injuries: "x".repeat(501),
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 for non-JSON body", async () => {
      const req = new NextRequest("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ── Active Member Gate ──

  describe("active member check", () => {
    it("returns 404 when no member exists for email", async () => {
      mockPrisma.member.findUnique.mockResolvedValue(null);

      const response = await POST(
        makeOnboardingRequest({ email: "nobody@test.com" })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("NOT_FOUND");
      expect(mockPrisma.member.update).not.toHaveBeenCalled();
    });

    it("returns 404 when member is pending", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "pending@test.com",
        status: "pending",
      });

      const response = await POST(
        makeOnboardingRequest({ email: "pending@test.com" })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when member is canceled", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "canceled@test.com",
        status: "canceled",
      });

      const response = await POST(
        makeOnboardingRequest({ email: "canceled@test.com" })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error.code).toBe("NOT_FOUND");
    });
  });

  // ── Happy Path ──

  describe("successful onboarding", () => {
    it("saves onboarding data and returns ok", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "active@test.com",
        status: "active",
      });
      mockPrisma.member.update.mockResolvedValue({});

      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          goal: "fat_loss",
          daysPerWeek: 4,
          minutesPerSession: 30,
          injuries: "Bad knee",
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
    });

    it("updates member with all onboarding fields", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "active@test.com",
        status: "active",
      });
      mockPrisma.member.update.mockResolvedValue({});

      await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          goal: "muscle",
          daysPerWeek: 5,
          minutesPerSession: 45,
          injuries: "Shoulder issue",
        })
      );

      expect(mockPrisma.member.update).toHaveBeenCalledWith({
        where: { email: "active@test.com" },
        data: expect.objectContaining({
          goal: "muscle",
          daysPerWeek: 5,
          minutesPerSession: 45,
          injuries: "Shoulder issue",
        }),
      });
    });

    it("sets onboardedAt timestamp", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "active@test.com",
        status: "active",
      });
      mockPrisma.member.update.mockResolvedValue({});

      await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          goal: "maintenance",
        })
      );

      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            onboardedAt: expect.any(Date),
          }),
        })
      );
    });

    it("allows email-only with all optional fields omitted", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "minimal@test.com",
        status: "active",
      });
      mockPrisma.member.update.mockResolvedValue({});

      const response = await POST(
        makeOnboardingRequest({ email: "minimal@test.com" })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe("ok");
      expect(mockPrisma.member.update).toHaveBeenCalledWith({
        where: { email: "minimal@test.com" },
        data: expect.objectContaining({
          goal: null,
          daysPerWeek: null,
          minutesPerSession: null,
          injuries: null,
        }),
      });
    });
  });

  // ── Extended Fields (Milestone K) ──

  describe("extended intake fields", () => {
    beforeEach(() => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "active@test.com",
        status: "active",
      });
      mockPrisma.member.update.mockResolvedValue({});
    });

    it("saves all extended fields when provided", async () => {
      const extendedPayload = {
        email: "active@test.com",
        goal: "muscle",
        daysPerWeek: 5,
        minutesPerSession: 45,
        // Extended — personal
        fullName: "John Doe",
        age: 28,
        height: "5'10\"",
        currentWeight: "180 lbs",
        timezone: "EST",
        // Training
        yearsTraining: 3,
        currentSplit: "PPL",
        favoriteLifts: "Squat, bench",
        weakBodyParts: "Shoulders",
        equipmentAccess: "full_gym",
        // Nutrition
        currentCalories: 2200,
        proteinIntake: 160,
        mealsPerDay: 3,
        foodsEnjoy: "Chicken, rice",
        foodsAvoid: "Dairy",
        appetiteLevel: "normal",
        weekendEating: "Eat out weekends",
        alcoholIntake: "Social only",
        supplements: "Creatine",
        // Lifestyle
        avgSleep: 7.5,
        stressLevel: "moderate",
        stepCount: 8000,
        jobActivityLevel: "sedentary",
        travelFrequency: "1x/month",
        // Commitment
        fallOffCause: "Travel",
        supportNeeded: "Accountability",
        success90Days: "Lose 15 lbs",
      };

      const response = await POST(makeOnboardingRequest(extendedPayload));
      expect(response.status).toBe(200);

      const updateCall = mockPrisma.member.update.mock.calls[0][0];
      expect(updateCall.data.fullName).toBe("John Doe");
      expect(updateCall.data.age).toBe(28);
      expect(updateCall.data.height).toBe("5'10\"");
      expect(updateCall.data.currentWeight).toBe("180 lbs");
      expect(updateCall.data.yearsTraining).toBe(3);
      expect(updateCall.data.currentSplit).toBe("PPL");
      expect(updateCall.data.equipmentAccess).toBe("full_gym");
      expect(updateCall.data.currentCalories).toBe(2200);
      expect(updateCall.data.proteinIntake).toBe(160);
      expect(updateCall.data.mealsPerDay).toBe(3);
      expect(updateCall.data.appetiteLevel).toBe("normal");
      expect(updateCall.data.avgSleep).toBe(7.5);
      expect(updateCall.data.stressLevel).toBe("moderate");
      expect(updateCall.data.stepCount).toBe(8000);
      expect(updateCall.data.jobActivityLevel).toBe("sedentary");
      expect(updateCall.data.fallOffCause).toBe("Travel");
      expect(updateCall.data.supportNeeded).toBe("Accountability");
      expect(updateCall.data.success90Days).toBe("Lose 15 lbs");
    });

    it("does not null out extended fields when omitted", async () => {
      const response = await POST(
        makeOnboardingRequest({ email: "active@test.com", goal: "fat_loss" })
      );
      expect(response.status).toBe(200);

      const updateCall = mockPrisma.member.update.mock.calls[0][0];
      // Basic fields get nulled when missing
      expect(updateCall.data.injuries).toBeNull();
      // Extended fields should NOT appear in update data when omitted
      expect(updateCall.data).not.toHaveProperty("fullName");
      expect(updateCall.data).not.toHaveProperty("age");
      expect(updateCall.data).not.toHaveProperty("yearsTraining");
      expect(updateCall.data).not.toHaveProperty("currentCalories");
      expect(updateCall.data).not.toHaveProperty("avgSleep");
      expect(updateCall.data).not.toHaveProperty("fallOffCause");
    });

    it("rejects invalid equipmentAccess enum", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          equipmentAccess: "home_gym",
        })
      );
      expect(response.status).toBe(400);
    });

    it("rejects invalid appetiteLevel enum", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          appetiteLevel: "very_high",
        })
      );
      expect(response.status).toBe(400);
    });

    it("rejects invalid stressLevel enum", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          stressLevel: "extreme",
        })
      );
      expect(response.status).toBe(400);
    });

    it("rejects invalid jobActivityLevel enum", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          jobActivityLevel: "very_active",
        })
      );
      expect(response.status).toBe(400);
    });

    it("rejects age below 13", async () => {
      const response = await POST(
        makeOnboardingRequest({ email: "active@test.com", age: 10 })
      );
      expect(response.status).toBe(400);
    });

    it("rejects fallOffCause exceeding 1000 characters", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          fallOffCause: "x".repeat(1001),
        })
      );
      expect(response.status).toBe(400);
    });

    it("allows partial extended fields", async () => {
      const response = await POST(
        makeOnboardingRequest({
          email: "active@test.com",
          fullName: "Jane",
          avgSleep: 8,
          stressLevel: "low",
        })
      );
      expect(response.status).toBe(200);

      const updateCall = mockPrisma.member.update.mock.calls[0][0];
      expect(updateCall.data.fullName).toBe("Jane");
      expect(updateCall.data.avgSleep).toBe(8);
      expect(updateCall.data.stressLevel).toBe("low");
      // Not provided → not in update data
      expect(updateCall.data).not.toHaveProperty("currentCalories");
    });
  });

  // ── Error Handling ──

  describe("error handling", () => {
    it("returns 500 when database update throws", async () => {
      mockPrisma.member.findUnique.mockResolvedValue({
        email: "active@test.com",
        status: "active",
      });
      mockPrisma.member.update.mockRejectedValue(new Error("DB down"));

      const response = await POST(
        makeOnboardingRequest({ email: "active@test.com" })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error.code).toBe("ONBOARDING_ERROR");
    });
  });
});
