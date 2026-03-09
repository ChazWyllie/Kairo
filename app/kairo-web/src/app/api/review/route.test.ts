/**
 * Tests for /api/review
 *
 * POST  — create a review (coach secret required)
 * GET   — get reviews by member email (public)
 * PATCH — update a review (coach secret required)
 *
 * All external calls mocked — no real DB.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { POST, GET, PATCH } from "@/app/api/review/route";

function makePostRequest(
  body: Record<string, unknown>,
  secret?: string
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/review", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function makeGetRequest(email: string): NextRequest {
  return new NextRequest(
    `http://localhost:3000/api/review?email=${encodeURIComponent(email)}`,
    { method: "GET" }
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
  return new NextRequest("http://localhost:3000/api/review", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/review", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.review.create.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await POST(
      makePostRequest({ email: "a@b.com", type: "monthly" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong coach secret", async () => {
    const res = await POST(
      makePostRequest({ email: "a@b.com", type: "monthly" }, "wrong-secret")
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with invalid type", async () => {
    const res = await POST(
      makePostRequest(
        { email: "a@b.com", type: "invalid_type" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with missing email", async () => {
    const res = await POST(
      makePostRequest({ type: "monthly" }, "test-coach-secret-1234567890")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await POST(
      makePostRequest(
        { email: "nobody@test.com", type: "monthly" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(404);
  });

  it("creates a review and returns 201", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "active@test.com",
    });
    mockPrisma.review.create.mockResolvedValue({
      id: "rev_1",
      type: "monthly",
      dueDate: null,
      completedDate: null,
      summary: "Good progress",
      actionItems: null,
      loomLink: null,
      followUpNeeded: false,
    });

    const res = await POST(
      makePostRequest(
        {
          email: "active@test.com",
          type: "monthly",
          summary: "Good progress",
        },
        "test-coach-secret-1234567890"
      )
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.review.id).toBe("rev_1");
    expect(data.review.type).toBe("monthly");
    expect(data.review.summary).toBe("Good progress");
  });

  it("creates a review with all optional fields", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "active@test.com",
    });
    mockPrisma.review.create.mockResolvedValue({
      id: "rev_2",
      type: "form_review",
      dueDate: new Date("2026-04-01T00:00:00.000Z"),
      completedDate: new Date("2026-03-15T00:00:00.000Z"),
      summary: "Form looks good",
      actionItems: '["Fix squat depth","Add hip hinge"]',
      loomLink: "https://loom.com/share/abc123",
      followUpNeeded: true,
    });

    const res = await POST(
      makePostRequest(
        {
          email: "active@test.com",
          type: "form_review",
          dueDate: "2026-04-01T00:00:00.000Z",
          completedDate: "2026-03-15T00:00:00.000Z",
          summary: "Form looks good",
          actionItems: '["Fix squat depth","Add hip hinge"]',
          loomLink: "https://loom.com/share/abc123",
          followUpNeeded: true,
        },
        "test-coach-secret-1234567890"
      )
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.review.type).toBe("form_review");
    expect(data.review.followUpNeeded).toBe(true);
    expect(data.review.loomLink).toBe("https://loom.com/share/abc123");
  });

  it("returns 500 when database throws", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "active@test.com",
    });
    mockPrisma.review.create.mockRejectedValue(new Error("DB down"));

    const res = await POST(
      makePostRequest(
        { email: "active@test.com", type: "monthly" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /api/review", () => {
  beforeEach(() => {
    mockPrisma.member.findUnique.mockReset();
    mockPrisma.review.findMany.mockReset();
  });

  it("returns 400 when email param is missing", async () => {
    const res = await GET(
      new NextRequest("http://localhost:3000/api/review", { method: "GET" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when member not found", async () => {
    mockPrisma.member.findUnique.mockResolvedValue(null);
    const res = await GET(makeGetRequest("nobody@test.com"));
    expect(res.status).toBe(404);
  });

  it("returns reviews for a member", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "active@test.com",
    });
    mockPrisma.review.findMany.mockResolvedValue([
      {
        id: "rev_1",
        type: "monthly",
        dueDate: null,
        completedDate: new Date("2026-03-01T00:00:00.000Z"),
        summary: "On track",
        actionItems: null,
        loomLink: null,
        followUpNeeded: false,
        createdAt: new Date("2026-03-01T00:00:00.000Z"),
      },
    ]);

    const res = await GET(makeGetRequest("active@test.com"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(1);
    expect(data.reviews[0].type).toBe("monthly");
    expect(data.reviews[0].summary).toBe("On track");
  });

  it("returns empty array when no reviews", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "active@test.com",
    });
    mockPrisma.review.findMany.mockResolvedValue([]);

    const res = await GET(makeGetRequest("active@test.com"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.reviews).toHaveLength(0);
  });

  it("returns 500 when database throws", async () => {
    mockPrisma.member.findUnique.mockResolvedValue({
      id: "m1",
      email: "active@test.com",
    });
    mockPrisma.review.findMany.mockRejectedValue(new Error("DB down"));

    const res = await GET(makeGetRequest("active@test.com"));
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/review", () => {
  beforeEach(() => {
    mockPrisma.review.findUnique.mockReset();
    mockPrisma.review.update.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await PATCH(
      makePatchRequest({ reviewId: "rev_1", summary: "Updated" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing reviewId", async () => {
    const res = await PATCH(
      makePatchRequest({ summary: "Updated" }, "test-coach-secret-1234567890")
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when review not found", async () => {
    mockPrisma.review.findUnique.mockResolvedValue(null);
    const res = await PATCH(
      makePatchRequest(
        { reviewId: "nonexistent", summary: "Updated" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(404);
  });

  it("updates a review successfully", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: "rev_1",
      type: "monthly",
    });
    mockPrisma.review.update.mockResolvedValue({});

    const res = await PATCH(
      makePatchRequest(
        {
          reviewId: "rev_1",
          summary: "Updated summary",
          followUpNeeded: true,
          loomLink: "https://loom.com/share/xyz",
        },
        "test-coach-secret-1234567890"
      )
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(mockPrisma.review.update).toHaveBeenCalledWith({
      where: { id: "rev_1" },
      data: expect.objectContaining({
        summary: "Updated summary",
        followUpNeeded: true,
        loomLink: "https://loom.com/share/xyz",
      }),
    });
  });

  it("marks a review as completed", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: "rev_1",
      type: "quarterly",
    });
    mockPrisma.review.update.mockResolvedValue({});

    const res = await PATCH(
      makePatchRequest(
        {
          reviewId: "rev_1",
          completedDate: "2026-03-07T00:00:00.000Z",
          summary: "Quarterly review done",
        },
        "test-coach-secret-1234567890"
      )
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.review.update).toHaveBeenCalledWith({
      where: { id: "rev_1" },
      data: expect.objectContaining({
        completedDate: expect.any(Date),
        summary: "Quarterly review done",
      }),
    });
  });

  it("returns 500 when database throws", async () => {
    mockPrisma.review.findUnique.mockResolvedValue({
      id: "rev_1",
      type: "monthly",
    });
    mockPrisma.review.update.mockRejectedValue(new Error("DB down"));

    const res = await PATCH(
      makePatchRequest(
        { reviewId: "rev_1", summary: "Updated" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(500);
  });
});
