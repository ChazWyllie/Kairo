/**
 * Tests for PATCH /api/checkin/respond
 *
 * Coach responds to a check-in with triage status and response text.
 * Requires COACH_SECRET.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/test/setup";
import { PATCH } from "@/app/api/checkin/respond/route";

function makePatchRequest(
  body: Record<string, unknown>,
  secret?: string
): NextRequest {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/checkin/respond", {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/checkin/respond", () => {
  beforeEach(() => {
    mockPrisma.checkIn.findUnique.mockReset();
    mockPrisma.checkIn.update.mockReset();
  });

  it("returns 401 without coach secret", async () => {
    const res = await PATCH(
      makePatchRequest({ checkInId: "ci_1", coachStatus: "green" })
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong coach secret", async () => {
    const res = await PATCH(
      makePatchRequest(
        { checkInId: "ci_1", coachStatus: "green" },
        "wrong-secret"
      )
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 with missing checkInId", async () => {
    const res = await PATCH(
      makePatchRequest({ coachStatus: "green" }, "test-coach-secret-1234567890")
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 with invalid coachStatus", async () => {
    const res = await PATCH(
      makePatchRequest(
        { checkInId: "ci_1", coachStatus: "purple" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 when check-in not found", async () => {
    mockPrisma.checkIn.findUnique.mockResolvedValue(null);
    const res = await PATCH(
      makePatchRequest(
        { checkInId: "ci_nonexistent", coachStatus: "green" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(404);
  });

  it("triages a check-in as green", async () => {
    mockPrisma.checkIn.findUnique.mockResolvedValue({
      id: "ci_1",
      memberId: "m1",
    });
    mockPrisma.checkIn.update.mockResolvedValue({});

    const res = await PATCH(
      makePatchRequest(
        {
          checkInId: "ci_1",
          coachStatus: "green",
          coachResponse: "Great job, keep it up!",
        },
        "test-coach-secret-1234567890"
      )
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("ok");
    expect(mockPrisma.checkIn.update).toHaveBeenCalledWith({
      where: { id: "ci_1" },
      data: expect.objectContaining({
        coachStatus: "green",
        coachResponse: "Great job, keep it up!",
        responseAt: expect.any(Date),
      }),
    });
  });

  it("triages a check-in as red without response text", async () => {
    mockPrisma.checkIn.findUnique.mockResolvedValue({
      id: "ci_2",
      memberId: "m1",
    });
    mockPrisma.checkIn.update.mockResolvedValue({});

    const res = await PATCH(
      makePatchRequest(
        { checkInId: "ci_2", coachStatus: "red" },
        "test-coach-secret-1234567890"
      )
    );

    expect(res.status).toBe(200);
    expect(mockPrisma.checkIn.update).toHaveBeenCalledWith({
      where: { id: "ci_2" },
      data: expect.objectContaining({
        coachStatus: "red",
        coachResponse: null,
      }),
    });
  });

  it("returns 500 when database throws", async () => {
    mockPrisma.checkIn.findUnique.mockResolvedValue({
      id: "ci_1",
      memberId: "m1",
    });
    mockPrisma.checkIn.update.mockRejectedValue(new Error("DB down"));

    const res = await PATCH(
      makePatchRequest(
        { checkInId: "ci_1", coachStatus: "yellow" },
        "test-coach-secret-1234567890"
      )
    );
    expect(res.status).toBe(500);
  });
});
