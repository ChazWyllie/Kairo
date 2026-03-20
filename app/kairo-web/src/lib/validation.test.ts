/**
 * Tests for lib/validation.ts
 *
 * Covers: isValidEmail — the single source of truth for email validation
 * used on both client and server.
 */
import { describe, it, expect } from "vitest";
import { isValidEmail } from "@/lib/validation";

describe("isValidEmail", () => {
  // ── Valid emails ──

  it("accepts a standard email address", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });

  it("accepts email with plus tag", () => {
    expect(isValidEmail("user+tag@example.com")).toBe(true);
  });

  it("accepts email with subdomain", () => {
    expect(isValidEmail("user@sub.domain.co")).toBe(true);
  });

  it("accepts email with numbers in local part", () => {
    expect(isValidEmail("user123@example.org")).toBe(true);
  });

  it("trims whitespace before validating", () => {
    expect(isValidEmail("  user@example.com  ")).toBe(true);
  });

  // ── Invalid emails ──

  it("rejects email with no local part", () => {
    expect(isValidEmail("@nodomain.com")).toBe(false);
  });

  it("rejects email with no at sign", () => {
    expect(isValidEmail("noatsign")).toBe(false);
  });

  it("rejects email with double at sign", () => {
    expect(isValidEmail("double@@at.com")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });

  it("rejects whitespace only", () => {
    expect(isValidEmail("   ")).toBe(false);
  });

  it("rejects email with spaces inside", () => {
    expect(isValidEmail("user @example.com")).toBe(false);
  });

  it("rejects email with no TLD", () => {
    expect(isValidEmail("user@nodot")).toBe(false);
  });
});
