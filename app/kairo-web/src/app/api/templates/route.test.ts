/**
 * Tests for /api/templates
 *
 * GET — retrieve coach message templates (coach secret required)
 *
 * No DB needed — templates are static.
 */
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/templates/route";

const COACH_SECRET = "test-coach-secret-1234567890";

function makeRequest(secret?: string, category?: string): NextRequest {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const query = params.toString();
  const url = query
    ? `http://localhost:3000/api/templates?${query}`
    : "http://localhost:3000/api/templates";
  const headers: Record<string, string> = {};
  if (secret) {
    headers["authorization"] = `Bearer ${secret}`;
  }
  return new NextRequest(url, { method: "GET", headers });
}

describe("GET /api/templates", () => {
  it("returns 401 without coach secret", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong secret", async () => {
    const res = await GET(makeRequest("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("returns all templates with valid secret", async () => {
    const res = await GET(makeRequest(COACH_SECRET));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.templates).toBeDefined();
    expect(json.templates.length).toBeGreaterThanOrEqual(9);

    // Check template structure
    const t = json.templates[0];
    expect(t.id).toBeDefined();
    expect(t.name).toBeDefined();
    expect(t.category).toBeDefined();
    expect(t.body).toBeDefined();
    expect(t.variables).toBeInstanceOf(Array);
  });

  it("includes all required template categories", async () => {
    const res = await GET(makeRequest(COACH_SECRET));
    const json = await res.json();
    const categories = [...new Set(json.templates.map((t: { category: string }) => t.category))];
    expect(categories).toContain("lead");
    expect(categories).toContain("onboarding");
    expect(categories).toContain("checkin");
    expect(categories).toContain("review");
    expect(categories).toContain("retention");
  });

  it("includes the weekly review template with Win/Data/Decision/Focus structure", async () => {
    const res = await GET(makeRequest(COACH_SECRET));
    const json = await res.json();
    const weeklyReview = json.templates.find((t: { id: string }) => t.id === "weekly-review");
    expect(weeklyReview).toBeDefined();
    expect(weeklyReview.body).toContain("Win:");
    expect(weeklyReview.body).toContain("Data:");
    expect(weeklyReview.body).toContain("Decision:");
    expect(weeklyReview.body).toContain("Focus:");
    expect(weeklyReview.category).toBe("review");
  });

  it("filters by category when specified", async () => {
    const res = await GET(makeRequest(COACH_SECRET, "lead"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.templates.length).toBe(2); // lead-auto-response, lead-approved
    json.templates.forEach((t: { category: string }) => {
      expect(t.category).toBe("lead");
    });
  });

  it("returns empty array for unknown category", async () => {
    const res = await GET(makeRequest(COACH_SECRET, "nonexistent"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.templates).toHaveLength(0);
  });

  it("includes re-engagement template for retention", async () => {
    const res = await GET(makeRequest(COACH_SECRET, "retention"));
    const json = await res.json();
    expect(json.templates.length).toBeGreaterThanOrEqual(1);
    const reengagement = json.templates.find((t: { id: string }) => t.id === "re-engagement");
    expect(reengagement).toBeDefined();
    expect(reengagement.variables).toContain("[Name]");
  });

  it("all templates have non-empty bodies and valid ids", async () => {
    const res = await GET(makeRequest(COACH_SECRET));
    const json = await res.json();
    json.templates.forEach((t: { id: string; name: string; body: string }) => {
      expect(t.id).toMatch(/^[a-z-]+$/);
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.body.length).toBeGreaterThan(20);
    });
  });
});
