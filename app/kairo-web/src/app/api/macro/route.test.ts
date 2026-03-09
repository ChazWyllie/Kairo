/**
 * Tests for /api/macro
 *
 * POST  — create a macro target (coach secret required)
 * GET   — get macro targets by member email (public)
 * PATCH — update a macro target (coach secret required)
 *
 * All external calls mocked — no real DB.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { POST, GET, PATCH } from "@/app/api/macro/route";

const COACH_SECRET = "test-coach-secret-1234567890";

function makePostRequest(
  body: Record<string, unknown>,
  secret?: string
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/macro", {
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
    `http://localhost:3000/api/macro?email=${encodeURIComponent(email)}`,
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
  return new NextRequest("http://localhost:3000/api/macro", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

// ── POST ──

describe("POST /api/macro", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.macroTarget.create.mockReset();
    mockPrisma.macroTarget.updateMany.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await POST(
      makePostRequest({
        email: "a@b.com",
        effectiveDate: "2025-01-01T00:00:00.000Z",
        calories: 2200,
        protein: 180,
      })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong coach secret", async () => {
    const res = await POST(
      makePostRequest(
        {
          email: "a@b.com",
          effectiveDate: "2025-01-01T00:00:00.000Z",
          calories: 2200,
          protein: 180,
        },
        "wrong-secret"
      )
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing calories", async () => {
    const res = await POST(
      makePostRequest(
        { email: "a@b.com", effectiveDate: "2025-01-01T00:00:00.000Z", protein: 180 },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing protein", async () => {
    const res = await POST(
      makePostRequest(
        { email: "a@b.com", effectiveDate: "2025-01-01T00:00:00.000Z", calories: 2200 },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with calories below minimum (800)", async () => {
    const res = await POST(
      makePostRequest(
        { email: "a@b.com", effectiveDate: "2025-01-01T00:00:00.000Z", calories: 500, protein: 100 },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await POST(
      makePostRequest(
        {
          email: "nobody@test.com",
          effectiveDate: "2025-01-01T00:00:00.000Z",
          calories: 2200,
          protein: 180,
        },
        COACH_SECRET
      )
    );
    expect(res.status).toBe(404);
  });

  it("creates a macro target and deactivates previous active", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.macroTarget.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.macroTarget.create.mockResolvedValue({
      id: "mt1",
      memberId: "m1",
      status: "active",
      effectiveDate: new Date("2025-01-01"),
      calories: 2200,
      protein: 180,
      fatsMin: 55,
      carbs: 275,
      stepsTarget: 10000,
      hydrationTarget: "3L",
      adjustmentReason: "Starting cut phase",
      previousCalories: null,
      previousProtein: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(
      makePostRequest(
        {
          email: "client@test.com",
          effectiveDate: "2025-01-01T00:00:00.000Z",
          calories: 2200,
          protein: 180,
          fatsMin: 55,
          carbs: 275,
          stepsTarget: 10000,
          hydrationTarget: "3L",
          adjustmentReason: "Starting cut phase",
        },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.macro.id).toBe("mt1");
    expect(json.macro.calories).toBe(2200);
    expect(json.macro.protein).toBe(180);
    expect(json.macro.fatsMin).toBe(55);
    expect(json.macro.hydrationTarget).toBe("3L");

    // Verify previous active targets were deactivated
    expect(mockPrisma.macroTarget.updateMany).toHaveBeenCalledWith({
      where: { memberId: "m1", status: "active" },
      data: { status: "previous" },
    });
  });

  it("creates a minimal macro target with only required fields", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.macroTarget.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.macroTarget.create.mockResolvedValue({
      id: "mt2",
      memberId: "m1",
      status: "active",
      effectiveDate: new Date("2025-02-01"),
      calories: 2500,
      protein: 200,
      fatsMin: null,
      carbs: null,
      stepsTarget: null,
      hydrationTarget: null,
      adjustmentReason: null,
      previousCalories: null,
      previousProtein: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await POST(
      makePostRequest(
        {
          email: "client@test.com",
          effectiveDate: "2025-02-01T00:00:00.000Z",
          calories: 2500,
          protein: 200,
        },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.macro.calories).toBe(2500);
    expect(json.macro.fatsMin).toBeNull();
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.macroTarget.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.macroTarget.create.mockRejectedValue(new Error("DB error"));

    const res = await POST(
      makePostRequest(
        {
          email: "client@test.com",
          effectiveDate: "2025-01-01T00:00:00.000Z",
          calories: 2200,
          protein: 180,
        },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("MACRO_ERROR");
  });
});

// ── GET ──

describe("GET /api/macro", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.macroTarget.findMany.mockReset();
  });

  it("returns 401 without authentication", async () => {
    const res = await GET(makeGetRequest("a@b.com", ""));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 without email param", async () => {
    const req = new NextRequest("http://localhost:3000/api/macro", { method: "GET" });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await GET(makeGetRequest("nobody@test.com"));
    expect(res.status).toBe(404);
  });

  it("returns macro targets for a member", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.macroTarget.findMany.mockResolvedValue([
      {
        id: "mt1",
        status: "active",
        effectiveDate: new Date("2025-02-01"),
        calories: 2200,
        protein: 180,
        fatsMin: 55,
        carbs: 275,
        stepsTarget: 10000,
        hydrationTarget: "3L",
        adjustmentReason: "Cut phase",
        previousCalories: 2500,
        previousProtein: 200,
        createdAt: new Date("2025-02-01"),
      },
      {
        id: "mt0",
        status: "previous",
        effectiveDate: new Date("2025-01-01"),
        calories: 2500,
        protein: 200,
        fatsMin: 60,
        carbs: 300,
        stepsTarget: 8000,
        hydrationTarget: "3L",
        adjustmentReason: null,
        previousCalories: null,
        previousProtein: null,
        createdAt: new Date("2025-01-01"),
      },
    ]);

    const res = await GET(makeGetRequest("client@test.com"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.macros).toHaveLength(2);
    expect(json.macros[0].status).toBe("active");
    expect(json.macros[0].calories).toBe(2200);
    expect(json.macros[0].previousCalories).toBe(2500);
    expect(json.macros[1].status).toBe("previous");
  });

  it("returns empty array when member has no macros", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m2", email: "new@test.com" });
    mockPrisma.macroTarget.findMany.mockResolvedValue([]);

    const res = await GET(makeGetRequest("new@test.com"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.macros).toHaveLength(0);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({ id: "m1", email: "client@test.com" });
    mockPrisma.macroTarget.findMany.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeGetRequest("client@test.com"));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("MACRO_ERROR");
  });
});

// ── PATCH ──

describe("PATCH /api/macro", () => {
  beforeEach(() => {
    mockPrisma.macroTarget.findUnique.mockReset();
    mockPrisma.macroTarget.update.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await PATCH(makePatchRequest({ macroId: "mt1", calories: 2000 }));
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong coach secret", async () => {
    const res = await PATCH(
      makePatchRequest({ macroId: "mt1", calories: 2000 }, "wrong-secret")
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing macroId", async () => {
    const res = await PATCH(
      makePatchRequest({ calories: 2000 }, COACH_SECRET)
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when macro target not found", async () => {
    mockPrisma.macroTarget.findUnique.mockResolvedValue(null);
    const res = await PATCH(
      makePatchRequest({ macroId: "nonexistent", calories: 2000 }, COACH_SECRET)
    );
    expect(res.status).toBe(404);
  });

  it("updates macro and records previous values", async () => {
    mockPrisma.macroTarget.findUnique.mockResolvedValue({
      id: "mt1",
      calories: 2200,
      protein: 180,
      status: "active",
    });
    mockPrisma.macroTarget.update.mockResolvedValue({ id: "mt1" });

    const res = await PATCH(
      makePatchRequest(
        {
          macroId: "mt1",
          calories: 2000,
          protein: 190,
          adjustmentReason: "Reducing calories — plateau at 80kg",
        },
        COACH_SECRET
      )
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("ok");

    expect(mockPrisma.macroTarget.update).toHaveBeenCalledWith({
      where: { id: "mt1" },
      data: expect.objectContaining({
        calories: 2000,
        previousCalories: 2200,
        protein: 190,
        previousProtein: 180,
        adjustmentReason: "Reducing calories — plateau at 80kg",
      }),
    });
  });

  it("updates status without affecting calorie tracking", async () => {
    mockPrisma.macroTarget.findUnique.mockResolvedValue({
      id: "mt1",
      calories: 2200,
      protein: 180,
      status: "active",
    });
    mockPrisma.macroTarget.update.mockResolvedValue({ id: "mt1" });

    const res = await PATCH(
      makePatchRequest({ macroId: "mt1", status: "previous" }, COACH_SECRET)
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.macroTarget.update).toHaveBeenCalledWith({
      where: { id: "mt1" },
      data: { status: "previous" },
    });
  });

  it("returns 500 on database error", async () => {
    mockPrisma.macroTarget.findUnique.mockResolvedValue({ id: "mt1", calories: 2200, protein: 180 });
    mockPrisma.macroTarget.update.mockRejectedValue(new Error("DB error"));

    const res = await PATCH(
      makePatchRequest({ macroId: "mt1", calories: 2000 }, COACH_SECRET)
    );

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("MACRO_ERROR");
  });
});
