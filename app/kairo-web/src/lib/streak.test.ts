import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateStreak } from "./streak";

// Helper: create a local-midnight date (avoids UTC-vs-local timezone issues)
const localDate = (y: number, m: number, d: number) => new Date(y, m - 1, d);

describe("calculateStreak", () => {
  beforeEach(() => {
    // Fix "today" to 2026-03-09 noon local time for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 9, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 0 for empty array", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("returns 1 for a check-in today", () => {
    expect(calculateStreak([localDate(2026, 3, 9)])).toBe(1);
  });

  it("returns 1 for a check-in yesterday (no check-in today)", () => {
    expect(calculateStreak([localDate(2026, 3, 8)])).toBe(1);
  });

  it("returns correct count for consecutive days ending today", () => {
    const dates = [
      localDate(2026, 3, 9),
      localDate(2026, 3, 8),
      localDate(2026, 3, 7),
      localDate(2026, 3, 6),
    ];
    expect(calculateStreak(dates)).toBe(4);
  });

  it("returns correct count for consecutive days ending yesterday", () => {
    const dates = [
      localDate(2026, 3, 8),
      localDate(2026, 3, 7),
      localDate(2026, 3, 6),
    ];
    expect(calculateStreak(dates)).toBe(3);
  });

  it("stops at a gap in the streak", () => {
    const dates = [
      localDate(2026, 3, 9),
      localDate(2026, 3, 8),
      // gap: 2026-03-07 missing
      localDate(2026, 3, 6),
      localDate(2026, 3, 5),
    ];
    expect(calculateStreak(dates)).toBe(2);
  });

  it("returns 0 when most recent check-in is before yesterday", () => {
    const dates = [localDate(2026, 3, 6)];
    expect(calculateStreak(dates)).toBe(0);
  });

  it("deduplicates same-day entries", () => {
    const dates = [
      new Date(2026, 2, 9, 8, 0, 0),
      new Date(2026, 2, 9, 20, 0, 0),
      new Date(2026, 2, 8, 10, 0, 0),
    ];
    expect(calculateStreak(dates)).toBe(2);
  });

  it("handles unordered dates correctly", () => {
    const dates = [
      localDate(2026, 3, 7),
      localDate(2026, 3, 9),
      localDate(2026, 3, 8),
    ];
    expect(calculateStreak(dates)).toBe(3);
  });
});
