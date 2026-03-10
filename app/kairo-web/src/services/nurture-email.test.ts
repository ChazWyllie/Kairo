/**
 * Tests for sendNurtureEmail — email service integration with nurture templates.
 *
 * Uses vi.importActual to bypass the global mock in setup.ts (same pattern
 * as email.test.ts). Only Resend and env are mocked.
 *
 * Coverage:
 * - Happy path: valid step returns true, logs stub message
 * - Invalid step: returns false, no email sent
 * - Contract: function signature matches expected params
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResendSend = vi.fn().mockResolvedValue({ id: "email_456" });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

describe("sendNurtureEmail", () => {
  let sendNurtureEmail: (params: {
    email: string;
    step: number;
    recommendedTier: string | null;
    goal: string | null;
  }) => Promise<boolean>;

  beforeEach(async () => {
    mockResendSend.mockClear();
    const actual = await vi.importActual<typeof import("@/services/email")>(
      "@/services/email"
    );
    sendNurtureEmail = actual.sendNurtureEmail;
  });

  it("is exported as a function", () => {
    expect(typeof sendNurtureEmail).toBe("function");
  });

  it("returns true for a valid step (dev stub)", async () => {
    const result = await sendNurtureEmail({
      email: "test@example.com",
      step: 1,
      recommendedTier: "coaching",
      goal: "fat_loss",
    });
    expect(result).toBe(true);
  });

  it("returns false for an invalid step", async () => {
    const result = await sendNurtureEmail({
      email: "test@example.com",
      step: 99,
      recommendedTier: "coaching",
      goal: "fat_loss",
    });
    expect(result).toBe(false);
  });

  it("logs stub message when no RESEND_API_KEY", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendNurtureEmail({
      email: "test@example.com",
      step: 2,
      recommendedTier: "performance",
      goal: "muscle",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[email-stub]"),
      expect.objectContaining({
        step: 2,
      })
    );
    consoleSpy.mockRestore();
  });

  it("handles null tier and goal gracefully", async () => {
    const result = await sendNurtureEmail({
      email: "test@example.com",
      step: 3,
      recommendedTier: null,
      goal: null,
    });
    expect(result).toBe(true);
  });

  it.each([1, 2, 3, 4])("returns true for step %i", async (step) => {
    const result = await sendNurtureEmail({
      email: "test@example.com",
      step,
      recommendedTier: "foundation",
      goal: "fat_loss",
    });
    expect(result).toBe(true);
  });
});
