/**
 * Tests for POST /api/quiz — Quiz submission + lead capture.
 *
 * Behavior matrix coverage:
 * - Happy path: valid submission, tier recommendation
 * - Boundary: minimal answers, max values, all optional skipped
 * - Invalid input: missing email, bad email, invalid goal, out-of-range days
 * - Idempotency: same email submits twice → upsert not duplicate
 * - Security: no PII in errors, rate limiting
 * - Dependency failure: DB unavailable → safe 500
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  mockPrisma,
  mockQuizRateLimitCheck,
  mockSendQuizWelcomeEmail,
} from "@/test/setup";
import {
  FULL_QUIZ_SUBMISSION,
  MINIMAL_QUIZ_SUBMISSION,
  MOCK_LEAD,
} from "@/test/fixtures";

// Import route handler (will be created in implementation phase)
import { POST } from "@/app/api/quiz/route";

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/quiz", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/quiz", () => {
  beforeEach(() => {
    mockPrisma.lead.upsert.mockReset();
    mockPrisma.lead.findUnique.mockReset();
    mockQuizRateLimitCheck.mockReturnValue({ allowed: true, retryAfter: 0 });
    mockSendQuizWelcomeEmail.mockReset();

    // Default: successful upsert
    mockPrisma.lead.upsert.mockResolvedValue(MOCK_LEAD);
  });

  // ── Happy Path ──

  it("creates a lead and returns recommended tier for full submission", async () => {
    const res = await POST(makeRequest(FULL_QUIZ_SUBMISSION));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recommendedTier).toBeDefined();
    expect(typeof data.recommendedTier).toBe("string");
    expect(data.leadId).toBeDefined();
  });

  it("calls prisma.lead.upsert with correct email", async () => {
    await POST(makeRequest(FULL_QUIZ_SUBMISSION));

    expect(mockPrisma.lead.upsert).toHaveBeenCalledTimes(1);
    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.where.email).toBe("quiz@test.com");
  });

  it("stores quiz answers in the lead", async () => {
    await POST(makeRequest(FULL_QUIZ_SUBMISSION));

    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.create.quizAnswers).toEqual(FULL_QUIZ_SUBMISSION.answers);
  });

  it("sends quiz welcome email on successful lead creation", async () => {
    await POST(makeRequest(FULL_QUIZ_SUBMISSION));

    expect(mockSendQuizWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockSendQuizWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "quiz@test.com" })
    );
  });

  // ── Tier Recommendation Logic ──

  it("recommends 'foundation' for beginner/low-commitment users", async () => {
    const submission = {
      email: "beginner@test.com",
      answers: {
        goal: "maintenance",
        experience: "beginner",
        daysPerWeek: 2,
        minutesPerSession: 15,
        challenge: "time",
      },
    };
    mockPrisma.lead.upsert.mockResolvedValue({
      ...MOCK_LEAD,
      recommendedTier: "foundation",
    });

    const res = await POST(makeRequest(submission));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recommendedTier).toBe("foundation");
  });

  it("recommends higher tier for advanced/high-commitment users", async () => {
    const submission = {
      email: "advanced@test.com",
      answers: {
        goal: "muscle",
        experience: "advanced",
        daysPerWeek: 6,
        minutesPerSession: 60,
        challenge: "plateau",
      },
    };
    mockPrisma.lead.upsert.mockResolvedValue({
      ...MOCK_LEAD,
      recommendedTier: "performance",
    });

    const res = await POST(makeRequest(submission));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(["performance", "vip"]).toContain(data.recommendedTier);
  });

  // ── Boundary Cases ──

  it("accepts minimal submission (email only, empty answers)", async () => {
    mockPrisma.lead.upsert.mockResolvedValue({
      ...MOCK_LEAD,
      quizAnswers: {},
      recommendedTier: "foundation",
    });

    const res = await POST(makeRequest(MINIMAL_QUIZ_SUBMISSION));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.recommendedTier).toBe("foundation");
  });

  it("accepts daysPerWeek at minimum boundary (1)", async () => {
    const res = await POST(
      makeRequest({
        email: "boundary@test.com",
        answers: { daysPerWeek: 1 },
      })
    );
    expect(res.status).toBe(200);
  });

  it("accepts daysPerWeek at maximum boundary (7)", async () => {
    const res = await POST(
      makeRequest({
        email: "boundary@test.com",
        answers: { daysPerWeek: 7 },
      })
    );
    expect(res.status).toBe(200);
  });

  // ── Invalid Input ──

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({ answers: { goal: "muscle" } }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(
      makeRequest({ email: "not-an-email", answers: {} })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid goal value", async () => {
    const res = await POST(
      makeRequest({
        email: "test@test.com",
        answers: { goal: "fly_to_moon" },
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for daysPerWeek below range (0)", async () => {
    const res = await POST(
      makeRequest({
        email: "test@test.com",
        answers: { daysPerWeek: 0 },
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for daysPerWeek above range (8)", async () => {
    const res = await POST(
      makeRequest({
        email: "test@test.com",
        answers: { daysPerWeek: 8 },
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for empty body", async () => {
    const res = await POST(
      new NextRequest("http://localhost:3000/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
    );

    expect(res.status).toBe(400);
  });

  it("returns 400 for non-JSON body", async () => {
    const res = await POST(
      new NextRequest("http://localhost:3000/api/quiz", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json at all",
      })
    );

    expect(res.status).toBe(400);
  });

  // ── Idempotency ──

  it("upserts on duplicate email (does not create second lead)", async () => {
    // First submission
    await POST(makeRequest(FULL_QUIZ_SUBMISSION));
    // Second submission with different answers
    await POST(
      makeRequest({
        ...FULL_QUIZ_SUBMISSION,
        answers: { goal: "fat_loss" },
      })
    );

    // Should use upsert both times (not create)
    expect(mockPrisma.lead.upsert).toHaveBeenCalledTimes(2);
    // Both calls should use upsert where clause on email
    const calls = mockPrisma.lead.upsert.mock.calls;
    expect(calls[0][0].where.email).toBe("quiz@test.com");
    expect(calls[1][0].where.email).toBe("quiz@test.com");
  });

  it("updates quiz answers on re-submission", async () => {
    await POST(
      makeRequest({
        email: "quiz@test.com",
        answers: { goal: "fat_loss", daysPerWeek: 3 },
      })
    );

    const call = mockPrisma.lead.upsert.mock.calls[0][0];
    expect(call.update.quizAnswers).toEqual({
      goal: "fat_loss",
      daysPerWeek: 3,
    });
  });

  // ── Security ──

  it("does not expose email in error responses", async () => {
    const badEmail = "bad-format";
    const res = await POST(
      makeRequest({ email: badEmail, answers: {} })
    );
    const data = await res.json();
    const responseText = JSON.stringify(data);

    expect(responseText).not.toContain(badEmail);
  });

  it("returns 429 when rate limited", async () => {
    mockQuizRateLimitCheck.mockReturnValue({ allowed: false, retryAfter: 30 });

    const res = await POST(makeRequest(FULL_QUIZ_SUBMISSION));
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("returns structured error format on all failures", async () => {
    const res = await POST(makeRequest({ email: "bad", answers: {} }));
    const data = await res.json();

    expect(data.error).toBeDefined();
    expect(data.error.code).toBeDefined();
    expect(data.error.message).toBeDefined();
  });

  // ── Dependency Failures ──

  it("returns 500 when database is unavailable", async () => {
    mockPrisma.lead.upsert.mockRejectedValue(new Error("Connection refused"));

    const res = await POST(makeRequest(FULL_QUIZ_SUBMISSION));
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error.code).toBe("QUIZ_ERROR");
    expect(data.error.message).not.toContain("Connection refused");
  });

  it("still returns lead even if welcome email fails", async () => {
    mockSendQuizWelcomeEmail.mockRejectedValue(new Error("Email service down"));

    const res = await POST(makeRequest(FULL_QUIZ_SUBMISSION));

    // Email failure should not block lead creation
    expect(res.status).toBe(200);
  });
});
