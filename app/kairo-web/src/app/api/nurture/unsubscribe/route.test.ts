/**
 * Tests for GET /api/nurture/unsubscribe — one-click email unsubscribe.
 *
 * Coverage:
 * - Happy path: valid email → sets nurtureOptedOut, returns success HTML
 * - Validation: invalid/missing email → 400
 * - Privacy: non-existent email still returns success (no info leak)
 * - Error handling: DB error → 500
 */
import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma } from "@/test/setup";
import { GET } from "@/app/api/nurture/unsubscribe/route";
import { NextRequest } from "next/server";

function makeRequest(email?: string): NextRequest {
  const url = email
    ? `http://localhost:3000/api/nurture/unsubscribe?email=${encodeURIComponent(email)}`
    : "http://localhost:3000/api/nurture/unsubscribe";
  return new NextRequest(url);
}

describe("GET /api/nurture/unsubscribe", () => {
  beforeEach(() => {
    mockPrisma.lead.updateMany.mockReset();
    mockPrisma.lead.updateMany.mockResolvedValue({ count: 1 });
  });

  // ── Happy Path ──

  it("returns 200 and success HTML for valid email", async () => {
    const res = await GET(makeRequest("test@example.com"));
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("unsubscribed");
    expect(res.headers.get("content-type")).toBe("text/html");
  });

  it("calls prisma.lead.updateMany with nurtureOptedOut=true", async () => {
    await GET(makeRequest("test@example.com"));

    expect(mockPrisma.lead.updateMany).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
      data: { nurtureOptedOut: true },
    });
  });

  // ── Privacy: no info leak ──

  it("returns success even when email does not exist (privacy)", async () => {
    mockPrisma.lead.updateMany.mockResolvedValue({ count: 0 });

    const res = await GET(makeRequest("nobody@example.com"));
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toContain("unsubscribed");
  });

  // ── Validation ──

  it("returns 400 for missing email", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await GET(makeRequest("not-an-email"));
    expect(res.status).toBe(400);
  });

  // ── Error Handling ──

  it("returns 500 when database throws", async () => {
    mockPrisma.lead.updateMany.mockRejectedValue(
      new Error("Connection refused")
    );

    const res = await GET(makeRequest("test@example.com"));
    expect(res.status).toBe(500);

    const html = await res.text();
    expect(html).toContain("went wrong");
  });
});
