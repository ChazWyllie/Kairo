/**
 * Tests for GET /api/member
 *
 * Lookup member profile by email (query param).
 * Returns: status, onboarding data, streak info.
 * Security: no auth (Stripe is identity provider), email-only lookup.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";

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
