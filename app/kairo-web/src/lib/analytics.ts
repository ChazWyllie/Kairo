/**
 * Lightweight analytics — fires named events with optional properties.
 *
 * In development: logs to console.
 * In production: forwards to Vercel Analytics via vaTrack().
 * No PII in event payloads.
 */
import { track as vaTrack } from "@vercel/analytics";

export type AnalyticsEvent =
  | { name: "page_view"; properties: { path: string } }
  | { name: "cta_click"; properties: { location: string; tier?: string } }
  | { name: "checkout_started"; properties: { hasPhone: boolean; tier?: string; interval?: string } }
  | { name: "checkout_error"; properties: { error: string; tier?: string } }
  | { name: "onboarding_submitted"; properties: { hasGoal: boolean } }
  | { name: "dashboard_loaded"; properties: { status: string } }
  | { name: "coach_dashboard_loaded"; properties: { clients: number } }
  | { name: "checkin_submitted"; properties: { workout: boolean } }
  | { name: "quiz_started"; properties: { source?: string } }
  | { name: "quiz_completed"; properties: { recommendedTier: string } }
  | { name: "quiz_result_viewed"; properties: { tier: string } }
  | { name: "application_submitted"; properties: { goal: string; tier: string } }
  | { name: "coach_login"; properties: Record<string, never> }
  | { name: "member_login"; properties: Record<string, never> }
  | { name: "member_registered"; properties: Record<string, never> }
  | { name: "member_logout"; properties: Record<string, never> }
  | { name: "membership_cancelled"; properties: Record<string, never> }
  | { name: "founding_member_cta_click"; properties: { tier: string; interval: string } };

/**
 * Track an analytics event.
 * In development/test: logs to console.
 * In production: no-op (until a real provider is wired up).
 *
 * Accepts an optional `isDev` override for testability.
 */
export function track(
  event: AnalyticsEvent,
  { isDev }: { isDev?: boolean } = {}
): void {
  if (typeof window === "undefined") return; // SSR guard

  const dev = isDev ?? process.env.NODE_ENV === "development";

  if (dev) {
    console.log("[analytics]", event.name, event.properties);
  } else {
    vaTrack(event.name, event.properties as Record<string, string | number | boolean>);
  }
}
