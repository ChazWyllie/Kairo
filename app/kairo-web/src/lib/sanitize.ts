/**
 * Escape HTML special characters to prevent HTML injection in email templates.
 * Covers the OWASP-recommended set: & < > " '
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
