/**
 * Tests for POST /api/auth/logout
 *
 * Clears the session cookie.
 */
import { describe, it, expect } from "vitest";
import "@/test/setup";

const { POST } = await import("./route");

describe("POST /api/auth/logout", () => {
  it("returns 200 with status ok", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("sets Set-Cookie header to clear the session", async () => {
    const res = await POST();
    const cookie = res.headers.get("Set-Cookie");
    expect(cookie).toBeTruthy();
    expect(cookie).toContain("kairo_session=;");
    expect(cookie).toContain("Max-Age=0");
  });

  it("includes HttpOnly and SameSite=Strict in clear cookie", async () => {
    const res = await POST();
    const cookie = res.headers.get("Set-Cookie");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
  });
});
