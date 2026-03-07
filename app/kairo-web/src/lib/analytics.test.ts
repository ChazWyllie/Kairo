/**
 * Tests for analytics utility.
 *
 * Validates: type safety, SSR guard, dev logging, prod no-op.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.unmock("@/lib/analytics");

import { track } from "@/lib/analytics";

describe("analytics", () => {
  const originalWindow = globalThis.window;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    // Simulate browser environment (Vitest runs in Node where window is undefined)
    // @ts-expect-error — minimal window stub for SSR guard
    globalThis.window = {};
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    globalThis.window = originalWindow;
  });

  it("logs event when isDev is true", () => {
    track({ name: "page_view", properties: { path: "/" } }, { isDev: true });

    expect(consoleSpy).toHaveBeenCalledWith("[analytics]", "page_view", {
      path: "/",
    });
  });

  it("does not log when isDev is false", () => {
    track(
      { name: "cta_click", properties: { location: "hero" } },
      { isDev: false }
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("does nothing during SSR (no window)", () => {
    // @ts-expect-error — simulating SSR
    delete globalThis.window;

    track({ name: "page_view", properties: { path: "/" } }, { isDev: true });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("logs checkout_started with hasPhone property", () => {
    track(
      { name: "checkout_started", properties: { hasPhone: true } },
      { isDev: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics]",
      "checkout_started",
      { hasPhone: true }
    );
  });

  it("logs checkout_error with error message", () => {
    track(
      { name: "checkout_error", properties: { error: "Payment failed" } },
      { isDev: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics]",
      "checkout_error",
      { error: "Payment failed" }
    );
  });

  it("logs quiz_started event", () => {
    track(
      { name: "quiz_started", properties: { source: "landing" } },
      { isDev: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics]",
      "quiz_started",
      { source: "landing" }
    );
  });

  it("logs quiz_completed event with tier", () => {
    track(
      { name: "quiz_completed", properties: { recommendedTier: "coaching" } },
      { isDev: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics]",
      "quiz_completed",
      { recommendedTier: "coaching" }
    );
  });

  it("logs quiz_result_viewed event", () => {
    track(
      { name: "quiz_result_viewed", properties: { tier: "performance" } },
      { isDev: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics]",
      "quiz_result_viewed",
      { tier: "performance" }
    );
  });

  it("logs onboarding_submitted event", () => {
    track(
      { name: "onboarding_submitted", properties: { hasGoal: true } },
      { isDev: true }
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      "[analytics]",
      "onboarding_submitted",
      { hasGoal: true }
    );
  });
});
