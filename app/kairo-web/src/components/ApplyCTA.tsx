"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import ScrollReveal from "@/components/ui/ScrollReveal";

/**
 * Bottom CTA section — the final conversion moment on the page.
 * Accent primary background makes it feel like a distinct "destination".
 * Links to /apply rather than embedding a form (avoids duplication with apply/page.tsx).
 */
export default function ApplyCTA() {
  return (
    <section
      id="apply"
      className="relative py-24 md:py-32 px-5 md:px-10 overflow-hidden"
      style={{ background: "var(--accent-primary)" }}
    >
      {/* Faint grid pattern — same as hero but inverted for the light bg */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-3xl text-center">
        <ScrollReveal>
          <p
            className="text-xs font-medium uppercase tracking-[0.15em] mb-6 opacity-60"
            style={{ color: "var(--bg-primary)" }}
          >
            Limited founding spots
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5rem)",
              letterSpacing: "-0.04em",
              color: "var(--bg-primary)",
            }}
          >
            Ready to stop
            <br />
            starting over?
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <p
            className="mt-6 mx-auto max-w-md text-base leading-relaxed"
            style={{ color: "rgba(10,10,10,0.65)" }}
          >
            Your plan is waiting. Join the waitlist for early access and lock in
            founding member pricing before it&apos;s gone.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/apply"
              onClick={() =>
                track({
                  name: "cta_click",
                  properties: { location: "apply_cta_bottom" },
                })
              }
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-8 py-4 text-base font-semibold transition-all duration-200 hover:-translate-y-px"
              style={{
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                minWidth: "260px",
              }}
            >
              <span>Join the Waitlist — Limited Founding Spots</span>
              <span
                className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={280}>
          <p
            className="mt-6 text-xs"
            style={{ color: "rgba(10,10,10,0.5)" }}
          >
            No commitment required · No spam · Just early access + founding member pricing.
          </p>

          <p
            className="mt-8 mx-auto max-w-sm text-xs leading-relaxed"
            style={{ color: "rgba(10,10,10,0.4)" }}
          >
            This is fitness coaching and general nutrition guidance, not medical advice.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
