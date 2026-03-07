/**
 * Tests for nurture batch processor.
 *
 * Coverage:
 * - Happy path: eligible leads get next nurture email
 * - Timing: leads too soon are skipped
 * - Exclusions: converted, opted-out, and completed leads are excluded
 * - Error handling: email failures don't crash the batch
 * - Step tracking: lastNurtureStep and lastNurtureAt are updated
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  mockPrisma,
  mockSendNurtureEmail,
} from "@/test/setup";
import { processNurtureBatch } from "@/services/nurture";

// Helper: create a mock lead
function makeLead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead_1",
    email: "test@example.com",
    quizAnswers: { goal: "fat_loss", experience: "beginner" },
    recommendedTier: "coaching",
    source: "quiz",
    capturedAt: new Date("2025-01-01T00:00:00Z"),
    convertedAt: null,
    lastNurtureStep: 0,
    lastNurtureAt: null,
    nurtureOptedOut: false,
    ...overrides,
  };
}

// Freeze "now" to control timing
const NOW = new Date("2025-01-03T00:00:00Z"); // 48h after capture

describe("processNurtureBatch", () => {
  beforeEach(() => {
    mockPrisma.lead.findMany.mockReset();
    mockPrisma.lead.update.mockReset();
    mockSendNurtureEmail.mockReset();
    mockSendNurtureEmail.mockResolvedValue(true);

    // Freeze Date.now
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Happy Path ──

  it("sends step 1 email to eligible lead after 24h", async () => {
    const lead = makeLead({
      capturedAt: new Date("2025-01-01T00:00:00Z"), // 48h ago — past 24h threshold
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    const result = await processNurtureBatch();

    expect(result.sent).toBe(1);
    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toBe(0);

    expect(mockSendNurtureEmail).toHaveBeenCalledWith({
      email: "test@example.com",
      step: 1,
      recommendedTier: "coaching",
      goal: "fat_loss",
    });

    expect(mockPrisma.lead.update).toHaveBeenCalledWith({
      where: { id: "lead_1" },
      data: {
        lastNurtureStep: 1,
        lastNurtureAt: NOW,
      },
    });
  });

  it("sends step 2 email when step 1 was sent 48h+ ago", async () => {
    const lead = makeLead({
      lastNurtureStep: 1,
      lastNurtureAt: new Date("2025-01-01T00:00:00Z"), // 48h ago
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    const result = await processNurtureBatch();

    expect(result.sent).toBe(1);
    expect(mockSendNurtureEmail).toHaveBeenCalledWith(
      expect.objectContaining({ step: 2 })
    );
  });

  it("processes multiple leads in one batch", async () => {
    const leads = [
      makeLead({ id: "lead_1", email: "a@test.com" }),
      makeLead({ id: "lead_2", email: "b@test.com" }),
    ];
    mockPrisma.lead.findMany.mockResolvedValue(leads);
    mockPrisma.lead.update.mockResolvedValue({});

    const result = await processNurtureBatch();

    expect(result.processed).toBe(2);
    expect(result.sent).toBe(2);
  });

  // ── Timing: Too Soon ──

  it("skips lead if not enough time has passed for step 1", async () => {
    const lead = makeLead({
      capturedAt: new Date("2025-01-02T12:00:00Z"), // only 12h ago
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);

    const result = await processNurtureBatch();

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockSendNurtureEmail).not.toHaveBeenCalled();
  });

  it("skips lead if not enough time since last nurture for step 2", async () => {
    const lead = makeLead({
      lastNurtureStep: 1,
      lastNurtureAt: new Date("2025-01-02T12:00:00Z"), // only 12h ago
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);

    const result = await processNurtureBatch();

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
  });

  // ── Exclusions (handled by Prisma where clause, but test the query) ──

  it("queries only non-converted, non-opted-out, incomplete leads", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);

    await processNurtureBatch();

    expect(mockPrisma.lead.findMany).toHaveBeenCalledWith({
      where: {
        convertedAt: null,
        nurtureOptedOut: false,
        lastNurtureStep: { lt: 4 },
      },
    });
  });

  it("returns zeros when no leads are eligible", async () => {
    mockPrisma.lead.findMany.mockResolvedValue([]);

    const result = await processNurtureBatch();

    expect(result).toEqual({
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
    });
  });

  // ── Error Handling ──

  it("counts errors but does not throw when email send fails", async () => {
    const lead = makeLead();
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockSendNurtureEmail.mockRejectedValue(new Error("Resend down"));

    const result = await processNurtureBatch();

    expect(result.errors).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  it("continues processing other leads after an error", async () => {
    const leads = [
      makeLead({ id: "lead_1", email: "a@test.com" }),
      makeLead({ id: "lead_2", email: "b@test.com" }),
    ];
    mockPrisma.lead.findMany.mockResolvedValue(leads);
    mockPrisma.lead.update.mockResolvedValue({});

    // First lead fails, second succeeds
    mockSendNurtureEmail
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(true);

    const result = await processNurtureBatch();

    expect(result.errors).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.processed).toBe(2);
  });

  // ── Goal extraction ──

  it("extracts goal from quizAnswers JSON", async () => {
    const lead = makeLead({
      quizAnswers: { goal: "muscle", experience: "intermediate" },
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    await processNurtureBatch();

    expect(mockSendNurtureEmail).toHaveBeenCalledWith(
      expect.objectContaining({ goal: "muscle" })
    );
  });

  it("passes null goal when quizAnswers is null", async () => {
    const lead = makeLead({ quizAnswers: null });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    await processNurtureBatch();

    expect(mockSendNurtureEmail).toHaveBeenCalledWith(
      expect.objectContaining({ goal: null })
    );
  });

  // ── sendNurtureEmail returns false (invalid step) ──

  it("skips when sendNurtureEmail returns false", async () => {
    const lead = makeLead();
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockSendNurtureEmail.mockResolvedValue(false);

    const result = await processNurtureBatch();

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(mockPrisma.lead.update).not.toHaveBeenCalled();
  });

  // ── Step 1 uses capturedAt, step 2+ uses lastNurtureAt ──

  it("uses capturedAt as reference for step 1 timing", async () => {
    // capturedAt is 25h ago → should send
    const lead = makeLead({
      capturedAt: new Date("2025-01-01T23:00:00Z"),
      lastNurtureStep: 0,
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    const result = await processNurtureBatch();
    expect(result.sent).toBe(1);
  });

  it("uses lastNurtureAt as reference for step 2 timing", async () => {
    // lastNurtureAt is 49h ago → should send step 2
    const lead = makeLead({
      lastNurtureStep: 1,
      lastNurtureAt: new Date("2025-01-01T00:00:00Z"),
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    const result = await processNurtureBatch();
    expect(result.sent).toBe(1);
    expect(mockSendNurtureEmail).toHaveBeenCalledWith(
      expect.objectContaining({ step: 2 })
    );
  });

  it("falls back to capturedAt when lastNurtureAt is null for step 2+", async () => {
    // Edge case: step 1 was set but lastNurtureAt wasn't recorded
    const lead = makeLead({
      lastNurtureStep: 1,
      lastNurtureAt: null,
      capturedAt: new Date("2025-01-01T00:00:00Z"),
    });
    mockPrisma.lead.findMany.mockResolvedValue([lead]);
    mockPrisma.lead.update.mockResolvedValue(lead);

    const result = await processNurtureBatch();
    expect(result.sent).toBe(1);
  });
});
