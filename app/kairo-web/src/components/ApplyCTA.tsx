"use client";

import Link from "next/link";
import { track } from "@/lib/analytics";
import ScrollReveal from "@/components/ui/ScrollReveal";

/**
 * Bottom CTA section with dual paths: coaching (primary) and templates (coming soon).
 * Accent primary background. Two side-by-side cards on desktop, stacked on mobile.
 */
export default function ApplyCTA() {
  return (
    <section
      id="apply"
      className="relative py-24 md:py-32 px-5 md:px-10 overflow-hidden"
      style={{ background: "var(--accent-primary)" }}
    >
      {/* Faint grid pattern — inverted for the light background */}
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

      <div className="relative mx-auto max-w-4xl">
        <ScrollReveal className="text-center mb-12">
          <p
            className="text-xs font-medium uppercase tracking-[0.15em] mb-6 opacity-60"
            style={{ color: "var(--bg-primary)" }}
          >
            Take the next step
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

        {/* Dual-path cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coaching path — primary */}
          <ScrollReveal delay={100}>
            <div
              style={{
                background: "var(--bg-primary)",
                borderRadius: "var(--radius-lg)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                height: "100%",
              }}
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.1em] mb-2"
                  style={{ color: "var(--accent-primary)" }}
                >
                  Coaching
                </p>
                <p
                  className="text-lg font-display font-bold"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                >
                  Get a plan built for your life.
                </p>
              </div>
              <Link
                href="/apply"
                onClick={() =>
                  track({ name: "cta_click", properties: { location: "apply_cta_coaching" } })
                }
                className="group inline-flex items-center justify-center gap-2 w-full rounded-[var(--radius-sm)] py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: "var(--accent-primary)",
                  color: "var(--bg-primary)",
                }}
              >
                Apply for Coaching
                <span
                  className="inline-block transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
              <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
                Founding spots available. Cancel anytime.
              </p>
            </div>
          </ScrollReveal>

          {/* Templates path — coming soon */}
          <ScrollReveal delay={180}>
            <div
              style={{
                background: "rgba(10,10,10,0.08)",
                border: "1px solid rgba(10,10,10,0.12)",
                borderRadius: "var(--radius-lg)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                height: "100%",
              }}
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-[0.1em] mb-2"
                  style={{ color: "rgba(10,10,10,0.5)" }}
                >
                  Guides
                </p>
                <p
                  className="text-lg font-display font-bold"
                  style={{ color: "var(--bg-primary)", letterSpacing: "-0.02em" }}
                >
                  Start with a guide on your own.
                </p>
              </div>
              <a
                href="#templates"
                className="inline-flex items-center justify-center w-full rounded-[var(--radius-sm)] py-3.5 text-base font-semibold"
                style={{
                  background: "rgba(10,10,10,0.1)",
                  color: "rgba(10,10,10,0.5)",
                  cursor: "default",
                  pointerEvents: "none",
                }}
                aria-disabled="true"
              >
                Coming Soon
              </a>
              <p className="text-xs text-center" style={{ color: "rgba(10,10,10,0.45)" }}>
                Training, nutrition, and supplement guides dropping soon.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Disclaimer */}
        <ScrollReveal delay={280}>
          <p
            className="mt-10 text-center mx-auto max-w-sm text-xs leading-relaxed"
            style={{ color: "rgba(10,10,10,0.4)" }}
          >
            This is fitness coaching and general nutrition guidance, not medical advice.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
