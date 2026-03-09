/**
 * Tests for GET /api/auth/me
 *
 * Returns the authenticated member's profile via session cookie.
 * Covers: no cookie, invalid/expired token, member not found, happy path.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";
import { createSessionToken } from "@/lib/auth";

const { GET } = await import("./route");

const TEST_EMAIL = "member@test.com";

async function makeAuthenticatedRequest(email?: string): Promise<Request> {
  const token = await createSessionToken(email ?? TEST_EMAIL);
  return new Request("http://localhost:3000/api/auth/me", {
    method: "GET",
    headers: {
      cookie: `kairo_session=${token}`,
    },
  });
}

function makeUnauthenticatedRequest(): Request {
  return new Request("http://localhost:3000/api/auth/me", {
    method: "GET",
  });
}

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
  });

  // ── Auth ──

  it("returns 401 when no cookie is present", async () => {
    const res = await GET(makeUnauthenticatedRequest() as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 when cookie has invalid token", async () => {
    const req = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: { cookie: "kairo_session=invalid.token.here" },
    });
    const res = await GET(req as never);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("SESSION_EXPIRED");
  });

  it("returns 401 when cookie has tampered token", async () => {
    const token = await createSessionToken(TEST_EMAIL);
    // Tamper with the signature
    const tampered = token.slice(0, -5) + "XXXXX";
    const req = new Request("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: { cookie: `kairo_session=${tampered}` },
    });
    const res = await GET(req as never);
    expect(res.status).toBe(401);
  });

  // ── Not found ──

  it("returns 404 when member not found in database", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const req = await makeAuthenticatedRequest();
    const res = await GET(req as never);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe("NOT_FOUND");
  });

  // ── Happy path ──

  it("returns member profile on valid session", async () => {
    const fakeMember = {
      email: TEST_EMAIL,
      status: "active",
      planTier: "foundation",
      billingInterval: "monthly",
      goal: "fat_loss",
      daysPerWeek: 4,
      fullName: "Test User",
      onboardedAt: new Date("2026-03-01"),
      createdAt: new Date("2026-02-28"),
    };
    mockPrisma.member.findUnique.mockResolvedValue(fakeMember);

    const req = await makeAuthenticatedRequest();
    const res = await GET(req as never);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.member.email).toBe(TEST_EMAIL);
    expect(body.member.status).toBe("active");
    expect(body.member.planTier).toBe("foundation");
    expect(body.member.goal).toBe("fat_loss");
    expect(body.member.fullName).toBe("Test User");
  });

  it("does not return Stripe IDs in response", async () => {
    const fakeMember = {
      email: TEST_EMAIL,
      status: "active",
      planTier: "foundation",
      billingInterval: "monthly",
      goal: null,
      daysPerWeek: null,
      fullName: null,
      onboardedAt: null,
      createdAt: new Date("2026-02-28"),
    };
    mockPrisma.member.findUnique.mockResolvedValue(fakeMember);

    const req = await makeAuthenticatedRequest();
    const res = await GET(req as never);
    const body = await res.json();

    // Route select explicitly excludes Stripe IDs
    expect(body.member).not.toHaveProperty("stripeSubId");
    expect(body.member).not.toHaveProperty("stripeCusId");
  });

  it("queries database with email from token", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);

    const req = await makeAuthenticatedRequest("specific@test.com");
    await GET(req as never);

    expect(mockPrisma.member.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "specific@test.com" },
      })
    );
  });
});
