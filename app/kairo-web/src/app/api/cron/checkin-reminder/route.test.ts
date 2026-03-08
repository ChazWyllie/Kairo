/**
 * Tests for /api/cron/checkin-reminder
 *
 * POST — send check-in reminders to active members who haven't checked in (3+ days)
 *
 * All external calls mocked — no real DB or email.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, mockSendCheckInReminder } from "@/test/setup";
import { POST } from "@/app/api/cron/checkin-reminder/route";

const CRON_SECRET = "test-cron-secret-1234567890";

function makeRequest(secret?: string): NextRequest {
  const url = secret
    ? `http://localhost:3000/api/cron/checkin-reminder?secret=${secret}`
    : "http://localhost:3000/api/cron/checkin-reminder";
  return new NextRequest(url, { method: "POST" });
}

describe("POST /api/cron/checkin-reminder", () => {
  beforeEach(() => {
    mockPrisma.member.findMany.mockReset();
    mockSendCheckInReminder.mockReset();
    mockSendCheckInReminder.mockResolvedValue(undefined);
  });

  it("returns 401 without cron secret", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong secret", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("sends reminders to members with no check-ins", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      {
        email: "client1@test.com",
        fullName: "Client One",
        checkIns: [], // never checked in
      },
    ]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eligible).toBe(1);
    expect(json.sent).toBe(1);
    expect(json.errors).toBe(0);
    expect(mockSendCheckInReminder).toHaveBeenCalledWith({
      email: "client1@test.com",
      fullName: "Client One",
    });
  });

  it("sends reminders to members with stale check-ins (3+ days)", async () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    mockPrisma.member.findMany.mockResolvedValue([
      {
        email: "stale@test.com",
        fullName: "Stale User",
        checkIns: [{ date: fourDaysAgo }],
      },
    ]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eligible).toBe(1);
    expect(json.sent).toBe(1);
  });

  it("skips members with recent check-ins (< 3 days)", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockPrisma.member.findMany.mockResolvedValue([
      {
        email: "active@test.com",
        fullName: "Active User",
        checkIns: [{ date: yesterday }],
      },
    ]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eligible).toBe(0);
    expect(json.sent).toBe(0);
    expect(mockSendCheckInReminder).not.toHaveBeenCalled();
  });

  it("handles mixed members (some need reminders, some don't)", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    mockPrisma.member.findMany.mockResolvedValue([
      {
        email: "active@test.com",
        fullName: "Active",
        checkIns: [{ date: yesterday }],
      },
      {
        email: "stale@test.com",
        fullName: "Stale",
        checkIns: [{ date: fiveDaysAgo }],
      },
      {
        email: "new@test.com",
        fullName: null,
        checkIns: [],
      },
    ]);

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eligible).toBe(2);
    expect(json.sent).toBe(2);
    expect(mockSendCheckInReminder).toHaveBeenCalledTimes(2);
  });

  it("counts email errors without failing the endpoint", async () => {
    mockPrisma.member.findMany.mockResolvedValue([
      {
        email: "fail@test.com",
        fullName: "Fail User",
        checkIns: [],
      },
    ]);
    mockSendCheckInReminder.mockRejectedValue(new Error("Email error"));

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.eligible).toBe(1);
    expect(json.sent).toBe(0);
    expect(json.errors).toBe(1);
  });

  it("returns 500 on database error", async () => {
    mockPrisma.member.findMany.mockRejectedValue(new Error("DB error"));

    const res = await POST(makeRequest(CRON_SECRET));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.code).toBe("CRON_ERROR");
  });
});
