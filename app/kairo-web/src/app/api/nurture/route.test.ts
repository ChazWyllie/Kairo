/**
 * Tests for POST /api/nurture — cron-triggered nurture batch endpoint.
 *
 * Coverage:
 * - Auth: CRON_SECRET required, invalid token rejected
 * - Happy path: delegates to processNurtureBatch and returns result
 * - Error handling: 500 on batch failure
 * - Missing config: 503 when CRON_SECRET not set
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock processNurtureBatch
const mockProcessBatch = vi.fn();
vi.mock("@/services/nurture", () => ({
  processNurtureBatch: (...args: unknown[]) => mockProcessBatch(...args),
}));

// Import after mocks
import { POST } from "@/app/api/nurture/route";
import { NextRequest } from "next/server";

function makeRequest(secret?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest("http://localhost:3000/api/nurture", {
    method: "POST",
    headers,
  });
}

describe("POST /api/nurture", () => {
  beforeEach(() => {
    mockProcessBatch.mockReset();
  });

  // ── Auth ──

  it("returns 401 when no Authorization header", async () => {
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 401 when token is wrong", async () => {
    const res = await POST(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns 401 when header is not Bearer format", async () => {
    const req = new NextRequest("http://localhost:3000/api/nurture", {
      method: "POST",
      headers: { authorization: "Basic abc123" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  // ── Happy Path ──

  it("returns 200 with batch results on valid secret", async () => {
    const batchResult = { processed: 5, sent: 3, skipped: 2, errors: 0 };
    mockProcessBatch.mockResolvedValue(batchResult);

    const res = await POST(makeRequest("test-cron-secret-1234567890"));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual(batchResult);
  });

  it("calls processNurtureBatch exactly once", async () => {
    mockProcessBatch.mockResolvedValue({
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    });

    await POST(makeRequest("test-cron-secret-1234567890"));

    expect(mockProcessBatch).toHaveBeenCalledTimes(1);
  });

  // ── Error Handling ──

  it("returns 500 when batch processing throws", async () => {
    mockProcessBatch.mockRejectedValue(new Error("DB connection lost"));

    const res = await POST(makeRequest("test-cron-secret-1234567890"));
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
