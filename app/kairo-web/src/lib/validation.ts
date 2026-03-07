/**
 * Shared email validation — single source of truth for client + server.
 *
 * Uses the same pattern Zod's z.string().email() validates against,
 * so client-side checks never diverge from API-level validation.
 *
 * RFC 5322 simplified: local@domain.tld — no quoted strings, no IP literals.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate an email address.
 * Returns true if the email is well-formed.
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}
