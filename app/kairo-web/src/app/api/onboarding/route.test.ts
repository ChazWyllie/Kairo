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

function makeOnboardingRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/onboarding", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.member.update.mockReset();
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
