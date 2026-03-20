/**
 * Tests for GET /api/member
 *
 * Lookup member profile by email (query param).
 * Returns: status, onboarding data, streak info.
 * Security: session cookie (email match) or coach Bearer token.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";
import { createSessionToken } from "@/lib/auth";

// Import after mocks are set up
const { GET } = await import("./route");

const COACH_SECRET = "test-coach-secret-1234567890";

function makeRequest(url: string, secret?: string) {
  const headers: Record<string, string> = {};
  if (secret !== "") {
    headers["authorization"] = `Bearer ${secret ?? COACH_SECRET}`;
  }
  return new Request(url, { method: "GET", headers });
}

describe("GET /api/member", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.checkIn.count.mockReset();
    mockPrisma.checkIn.findMany.mockReset();
  });

  // ── Auth ──

  it("returns 401 without authentication", async () => {
    const req = makeRequest("http://localhost:3000/api/member?email=user@test.com", "");
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  // ── Validation ──

  it("returns 400 if email query param is missing", async () => {
    const req = makeRequest("http://localhost:3000/api/member");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 if email is invalid", async () => {
    const req = makeRequest("http://localhost:3000/api/member?email=notanemail");
    const res = await GET(req as never);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  // ── Not found ──

  it("returns 404 if member does not exist", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const req = makeRequest("http://localhost:3000/api/member?email=nobody@test.com");
    const res = await GET(req as never);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  // ── Happy path ──

  it("returns member profile with check-in stats", async () => {
    const fakeMember = {
      id: "member_1",
      email: "user@test.com",
      status: "active",
      goal: "fat_loss",
      daysPerWeek: 4,
      minutesPerSession: 30,
      injuries: null,
      onboardedAt: new Date("2026-03-01"),
      createdAt: new Date("2026-02-28"),
    };

    mockPrisma.member.findUnique.mockResolvedValue(fakeMember);
    mockPrisma.checkIn.count.mockResolvedValue(10);
    mockPrisma.checkIn.findMany.mockResolvedValue([
      { date: new Date("2026-03-07") },
      { date: new Date("2026-03-06") },
      { date: new Date("2026-03-05") },
    ]);

    const req = makeRequest("http://localhost:3000/api/member?email=user@test.com");
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.member.email).toBe("user@test.com");
    expect(body.member.status).toBe("active");
    expect(body.member.goal).toBe("fat_loss");
    expect(body.stats.totalCheckIns).toBe(10);
    expect(body.stats.currentStreak).toBeGreaterThanOrEqual(0);
  });

  it("returns 0 streak and 0 check-ins for new member", async () => {
    const fakeMember = {
      id: "member_2",
      email: "new@test.com",
      status: "active",
      goal: null,
      daysPerWeek: null,
      minutesPerSession: null,
      injuries: null,
      onboardedAt: null,
      createdAt: new Date("2026-03-07"),
    };

    mockPrisma.member.findUnique.mockResolvedValue(fakeMember);
    mockPrisma.checkIn.count.mockResolvedValue(0);
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    const req = makeRequest("http://localhost:3000/api/member?email=new@test.com");
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.stats.totalCheckIns).toBe(0);
    expect(body.stats.currentStreak).toBe(0);
  });

  // ── Session cookie auth ──

  it("accepts session cookie auth for own email", async () => {
    const token = await createSessionToken("user@test.com");

    const fakeMember = {
      id: "member_sc1",
      email: "user@test.com",
      status: "active",
      planTier: "standard",
      billingInterval: "monthly",
      goal: "fat_loss",
      daysPerWeek: 3,
      minutesPerSession: 45,
      injuries: null,
      onboardedAt: new Date("2026-03-01"),
      createdAt: new Date("2026-02-01"),
    };

    mockPrisma.member.findUnique.mockResolvedValue(fakeMember);
    mockPrisma.checkIn.count.mockResolvedValue(5);
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    // No Bearer token — only session cookie
    const req = new Request("http://localhost:3000/api/member?email=user@test.com", {
      method: "GET",
      headers: { cookie: `kairo_session=${token}` },
    });

    const res = await GET(req as never);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.member.email).toBe("user@test.com");
    expect(body.stats.totalCheckIns).toBe(5);
  });

  it("returns 401 when session cookie email does not match requested email", async () => {
    // Alice's token trying to access Bob's data
    const aliceToken = await createSessionToken("alice@test.com");

    const req = new Request("http://localhost:3000/api/member?email=bob@test.com", {
      method: "GET",
      headers: { cookie: `kairo_session=${aliceToken}` },
    });

    const res = await GET(req as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  // ── Streak calculation ──

  it("returns correct streak for 3 consecutive days of check-ins", async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockPrisma.member.findUnique.mockResolvedValue({
      id: "member_streak",
      email: "user@test.com",
      status: "active",
      planTier: "standard",
      billingInterval: "monthly",
      goal: "muscle",
      daysPerWeek: 4,
      minutesPerSession: 30,
      injuries: null,
      onboardedAt: new Date("2026-01-01"),
      createdAt: new Date("2026-01-01"),
    });
    mockPrisma.checkIn.count.mockResolvedValue(3);
    mockPrisma.checkIn.findMany.mockResolvedValue([
      { date: today },
      { date: yesterday },
      { date: twoDaysAgo },
    ]);

    const req = makeRequest("http://localhost:3000/api/member?email=user@test.com");
    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.stats.currentStreak).toBe(3);
  });

  it("returns streak of 0 when last check-in was 3+ days ago (gap in streak)", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    mockPrisma.member.findUnique.mockResolvedValue({
      id: "member_no_streak",
      email: "user@test.com",
      status: "active",
      planTier: "standard",
      billingInterval: "monthly",
      goal: "muscle",
      daysPerWeek: 3,
      minutesPerSession: 30,
      injuries: null,
      onboardedAt: new Date("2026-01-01"),
      createdAt: new Date("2026-01-01"),
    });
    mockPrisma.checkIn.count.mockResolvedValue(1);
    mockPrisma.checkIn.findMany.mockResolvedValue([{ date: threeDaysAgo }]);

    const req = makeRequest("http://localhost:3000/api/member?email=user@test.com");
    const res = await GET(req as never);
    const body = await res.json();

    expect(body.stats.currentStreak).toBe(0);
  });

  // ── Response fields completeness ──

  it("returns all expected member fields in response", async () => {
    const onboardedAt = new Date("2026-03-01");
    const createdAt = new Date("2026-02-15");

    mockPrisma.member.findUnique.mockResolvedValue({
      id: "member_fields",
      email: "fields@test.com",
      status: "active",
      planTier: "premium",
      billingInterval: "annual",
      goal: "fat_loss",
      daysPerWeek: 5,
      minutesPerSession: 45,
      injuries: "left knee tendinitis",
      onboardedAt,
      createdAt,
    });
    mockPrisma.checkIn.count.mockResolvedValue(12);
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    const req = makeRequest("http://localhost:3000/api/member?email=fields@test.com");
    const res = await GET(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    // Member object fields
    expect(body.member.email).toBe("fields@test.com");
    expect(body.member.status).toBe("active");
    expect(body.member.planTier).toBe("premium");
    expect(body.member.billingInterval).toBe("annual");
    expect(body.member.goal).toBe("fat_loss");
    expect(body.member.daysPerWeek).toBe(5);
    expect(body.member.minutesPerSession).toBe(45);
    expect(body.member.injuries).toBe("left knee tendinitis");
    expect(body.member.onboardedAt).toBeTruthy();
    expect(body.member.createdAt).toBeTruthy();
    // Stats
    expect(body.stats.totalCheckIns).toBe(12);
    expect(typeof body.stats.currentStreak).toBe("number");
  });

  // ── Error handling ──

  it("returns 500 when database query fails", async () => {
    mockPrisma.member.findUnique.mockRejectedValue(new Error("DB connection refused"));

    const req = makeRequest("http://localhost:3000/api/member?email=user@test.com");
    const res = await GET(req as never);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("MEMBER_ERROR");
  });

  it("does not expose stripeCustomerId or stripeSubId", async () => {
    const fakeMember = {
      id: "member_3",
      email: "safe@test.com",
      status: "active",
      stripeCustomerId: "cus_secret123",
      stripeSubId: "sub_secret456",
      goal: null,
      daysPerWeek: null,
      minutesPerSession: null,
      injuries: null,
      onboardedAt: null,
      createdAt: new Date("2026-03-07"),
    };

    mockPrisma.member.findUnique.mockResolvedValue(fakeMember);
    mockPrisma.checkIn.count.mockResolvedValue(0);
    mockPrisma.checkIn.findMany.mockResolvedValue([]);

    const req = makeRequest("http://localhost:3000/api/member?email=safe@test.com");
    const res = await GET(req as never);
    const body = await res.json();

    expect(body.member.stripeCustomerId).toBeUndefined();
    expect(body.member.stripeSubId).toBeUndefined();
  });
});
