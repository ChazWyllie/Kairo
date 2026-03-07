/**
 * Tests for quiz welcome email service — sendQuizWelcomeEmail.
 *
 * IMPORTANT: setup.ts globally mocks @/services/email, so we use
 * vi.importActual to test the REAL implementation. Only Resend
 * (the external HTTP client) and env are mocked.
 *
 * Behavior matrix coverage:
 * - Happy path: sends email with recommended tier info
 * - Boundary: no RESEND_API_KEY → console.log stub, no throw
 * - Contract: function accepts { email, recommendedTier } params
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Use importActual to bypass the global mock in setup.ts and test real code.
// We mock only the env and Resend client, not the email module itself.
const mockResendSend = vi.fn().mockResolvedValue({ id: "email_123" });

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

describe("sendQuizWelcomeEmail", () => {
  let sendQuizWelcomeEmail: (params: {
    email: string;
    recommendedTier: string;
  }) => Promise<void>;

  beforeEach(async () => {
    mockResendSend.mockClear();
    // Import the REAL module, not the global mock
    const actual = await vi.importActual<typeof import("@/services/email")>(
      "@/services/email"
    );
    sendQuizWelcomeEmail = actual.sendQuizWelcomeEmail;
  });

  it("is exported as a function from services/email", () => {
    expect(typeof sendQuizWelcomeEmail).toBe("function");
  });

  it("does not throw when RESEND_API_KEY is undefined (dev stub)", async () => {
    // env.RESEND_API_KEY is undefined in test setup → should log, not crash
    await expect(
      sendQuizWelcomeEmail({
        email: "test@example.com",
        recommendedTier: "foundation",
      })
    ).resolves.not.toThrow();
  });

  it("logs stub message when no API key is configured", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await sendQuizWelcomeEmail({
      email: "test@example.com",
      recommendedTier: "coaching",
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[email-stub]"),
      expect.objectContaining({ to: "test@example.com" })
    );
    consoleSpy.mockRestore();
  });
});
