/**
 * Tests for /api/application
 *
 * POST  — submit an application (public)
 * GET   — check application status by email (public)
 * PATCH — approve/reject an application (coach secret required)
 *
 * All external calls mocked — no real DB or email.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { POST, GET, PATCH } from "@/app/api/application/route";

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/application", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeGetRequest(email: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/application?email=${encodeURIComponent(email)}`,
    { method: "GET" }
  );
}

function makePatchRequest(
  body: Record<string, unknown>,
  secret?: string
): NextRequest {
  const url = secret
    ? `http://localhost:3000/api/application?secret=${encodeURIComponent(secret)}`
    : "http://localhost:3000/api/application";
  return new NextRequest(url, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_APPLICATION = {
  email: "applicant@test.com",
  fullName: "Test User",
  goal: "fat_loss",
};

describe("POST /api/application", () => {
  beforeEach(() => {
    mockPrisma.application.create.mockReset();
    mockPrisma.application.findUnique.mockReset();
  });

  // ── Validation ──

  it("returns 400 when email is missing", async () => {
    const res = await POST(makePostRequest({ fullName: "No Email", goal: "muscle" }));
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(
      makePostRequest({ email: "bad", fullName: "Test", goal: "muscle" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when fullName is missing", async () => {
    const res = await POST(
      makePostRequest({ email: "test@test.com", goal: "fat_loss" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when goal is invalid enum", async () => {
    const res = await POST(
      makePostRequest({ email: "test@test.com", fullName: "Test", goal: "bulk_hard" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when preferredTier is invalid", async () => {
    const res = await POST(
      makePostRequest({
        ...VALID_APPLICATION,
        preferredTier: "free",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when gymAccess is invalid", async () => {
    const res = await POST(
      makePostRequest({
        ...VALID_APPLICATION,
        gymAccess: "planet_fitness",
      })
    );
    expect(res.status).toBe(400);
  });

  // ── Happy Path ──

  it("creates application and returns 201", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue({
      id: "app_123",
      ...VALID_APPLICATION,
      status: "pending",
    });

    const res = await POST(makePostRequest(VALID_APPLICATION));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.status).toBe("ok");
    expect(data.applicationId).toBe("app_123");
  });

  it("stores all optional fields when provided", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockResolvedValue({ id: "app_full" });

    const fullApp = {
      ...VALID_APPLICATION,
      phone: "+1234567890",
      age: 28,
      height: "5'10",
      currentWeight: "180lbs",
      whyNow: "Getting married",
      trainingExperience: "intermediate",
      trainingFrequency: "3x per week",
      gymAccess: "full_gym",
      injuryHistory: "ACL tear 2024",
      nutritionStruggles: "Late night snacking",
      biggestObstacle: "Consistency",
      helpWithMost: "Accountability",
      preferredTier: "coaching",
      readyForStructure: true,
      budgetComfort: "comfortable",
    };

    await POST(makePostRequest(fullApp));

    expect(mockPrisma.application.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "applicant@test.com",
        fullName: "Test User",
        goal: "fat_loss",
        phone: "+1234567890",
        age: 28,
        gymAccess: "full_gym",
        preferredTier: "coaching",
        readyForStructure: true,
      }),
    });
  });

  it("returns 409 when application already exists", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "app_existing",
      email: "applicant@test.com",
      status: "pending",
    });

    const res = await POST(makePostRequest(VALID_APPLICATION));
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error.code).toBe("DUPLICATE");
  });

  // ── Error Handling ──

  it("returns 500 when database throws", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);
    mockPrisma.application.create.mockRejectedValue(new Error("DB down"));

    const res = await POST(makePostRequest(VALID_APPLICATION));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error.code).toBe("APPLICATION_ERROR");
  });
});

describe("GET /api/application", () => {
  beforeEach(() => {
    mockPrisma.application.findUnique.mockReset();
  });

  it("returns 400 when email query param is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/application", {
      method: "GET",
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when email query param is invalid", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/application?email=notanemail",
      { method: "GET" }
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when no application found", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);

    const res = await GET(makeGetRequest("nobody@test.com"));
    expect(res.status).toBe(404);
  });

  it("returns application status for existing applicant", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "app_123",
      email: "applicant@test.com",
      fullName: "Test User",
      status: "pending",
      preferredTier: "coaching",
      createdAt: new Date("2026-03-01"),
    });

    const res = await GET(makeGetRequest("applicant@test.com"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.application.status).toBe("pending");
    expect(data.application.fullName).toBe("Test User");
  });
});

describe("PATCH /api/application", () => {
  beforeEach(() => {
    mockPrisma.application.findUnique.mockReset();
    mockPrisma.application.update.mockReset();
  });

  it("returns 401 when coach secret is missing", async () => {
    const res = await PATCH(
      makePatchRequest({ email: "test@test.com", status: "approved" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 when coach secret is wrong", async () => {
    const res = await PATCH(
      makePatchRequest(
        { email: "test@test.com", status: "approved" },
        "wrong-secret"
      )
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when status is invalid", async () => {
    const res = await PATCH(
      makePatchRequest(
        { email: "test@test.com", status: "maybe" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when application not found", async () => {
    mockPrisma.application.findUnique.mockResolvedValue(null);

    const res = await PATCH(
      makePatchRequest(
        { email: "nobody@test.com", status: "approved" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(404);
  });

  it("approves an application", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "app_123",
      email: "applicant@test.com",
      status: "pending",
    });
    mockPrisma.application.update.mockResolvedValue({
      id: "app_123",
      status: "approved",
    });

    const res = await PATCH(
      makePatchRequest(
        { email: "applicant@test.com", status: "approved" },
        "test-coach-secret-1234567890"
      )
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(mockPrisma.application.update).toHaveBeenCalledWith({
      where: { email: "applicant@test.com" },
      data: expect.objectContaining({
        status: "approved",
        approvedAt: expect.any(Date),
      }),
    });
  });

  it("rejects an application", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "app_123",
      email: "applicant@test.com",
      status: "pending",
    });
    mockPrisma.application.update.mockResolvedValue({
      id: "app_123",
      status: "rejected",
    });

    const res = await PATCH(
      makePatchRequest(
        { email: "applicant@test.com", status: "rejected" },
        "test-coach-secret-1234567890"
      )
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
  });

  it("returns 500 when database throws", async () => {
    mockPrisma.application.findUnique.mockResolvedValue({
      id: "app_123",
      status: "pending",
    });
    mockPrisma.application.update.mockRejectedValue(new Error("DB down"));

    const res = await PATCH(
      makePatchRequest(
        { email: "applicant@test.com", status: "approved" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(500);
  });
});
