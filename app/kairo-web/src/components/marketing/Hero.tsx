"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/**
 * Full-viewport hero section.
 * Headline uses Cabinet Grotesk (font-display) with weight contrast -- heavy/light split.
 * Background has a subtle accent orb that slowly breathes via orb-pulse keyframe.
 * All entrance animations are CSS-based (animate-slide-up) with staggered delays.
 */
export default function Hero() {
  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  return (
    <section
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-bg-primary"
      aria-label="Hero"
    >
      {/* Subtle CSS grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 70% at 50% 0%, black 30%, transparent 100%)",
        }}
      />

      {/* Accent orb */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-0 animate-orb-pulse"
        style={{
          width: "700px",
          height: "700px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          background:
            "radial-gradient(circle, rgba(224,255,79,0.08) 0%, rgba(79,255,224,0.04) 40%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Floating keyword badges */}
      <span
        aria-hidden="true"
        className="hidden lg:flex absolute left-[4%] top-1/3 -translate-y-1/2 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm animate-float"
        style={{
          borderColor: "var(--border-subtle)",
          background: "rgba(255,255,255,0.03)",
          color: "var(--text-tertiary)",
          animationDelay: "0s",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--accent-primary)", opacity: 0.6 }}
        />
        Accountability
      </span>
      <span
        aria-hidden="true"
        className="hidden lg:flex absolute right-[4%] top-2/5 -translate-y-1/2 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm animate-float"
        style={{
          borderColor: "var(--border-subtle)",
          background: "rgba(255,255,255,0.03)",
          color: "var(--text-tertiary)",
          animationDelay: "2s",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--accent-secondary)", opacity: 0.6 }}
        />
        Adaptable Plans
      </span>
      <span
        aria-hidden="true"
        className="hidden lg:flex absolute left-[5%] bottom-1/3 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-sm animate-float"
        style={{
          borderColor: "var(--border-subtle)",
          background: "rgba(255,255,255,0.03)",
          color: "var(--text-tertiary)",
          animationDelay: "4s",
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--accent-primary)", opacity: 0.6 }}
        />
        Real Results
      </span>

      {/* Main content */}
      <div className="relative z-10 mx-auto w-full max-w-5xl px-5 md:px-10 pt-28 pb-20 text-center">
        {/* Eyebrow label */}
        <p
          className="animate-fade-in text-xs font-medium uppercase tracking-[0.15em] mb-8"
          style={{ color: "var(--accent-primary)", animationDelay: "0ms" }}
        >
          Fitness coaching, redesigned
        </p>

        {/* Headline */}
        <h1
          className="font-display font-black leading-none animate-slide-up"
          style={{
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            letterSpacing: "-0.04em",
            animationDelay: "60ms",
          }}
        >
          <span className="block" style={{ color: "var(--text-primary)" }}>
            Coaching that
          </span>
          <span
            className="block font-normal"
            style={{ color: "var(--text-tertiary)" }}
          >
            adapts to your real life.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="mt-7 mx-auto max-w-[540px] text-base sm:text-lg leading-relaxed animate-slide-up"
          style={{
            color: "var(--text-secondary)",
            animationDelay: "160ms",
          }}
        >
          Personalized fitness and nutrition coaching that flexes with your schedule,
          stress, and energy. Plus training guides you can start on your own.
        </p>

        {/* CTAs */}
        <div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
          style={{ animationDelay: "260ms" }}
        >
          <a
            href="#coaching"
            onClick={() =>
              track({ name: "cta_click", properties: { location: "hero_primary" } })
            }
            className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-md)] px-8 py-4 text-base font-semibold btn-glow transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "var(--accent-primary)",
              color: "var(--bg-primary)",
              minWidth: "220px",
            }}
          >
            <span>Apply for Coaching</span>
            <span
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >

            </span>
          </a>

          <a
            href="#templates"
            className="text-sm font-medium transition-colors duration-200 link-underline"
            style={{ color: "var(--text-secondary)" }}
            onClick={() =>
              track({ name: "cta_click", properties: { location: "hero_secondary" } })
            }
          >
            Or browse our guides
          </a>
        </div>

        {/* Trust strip */}
        <p
          className="mt-12 text-xs uppercase tracking-[0.12em] animate-fade-in"
          style={{ color: "var(--text-tertiary)", animationDelay: "500ms" }}
          aria-label="Key features"
        >
          <span aria-hidden="true">✦</span> Personalized Plans
          {"  "}
          <span aria-hidden="true">✦</span> Adapts Weekly
          {"  "}
          <span aria-hidden="true">✦</span> From $149/month
          {"  "}
          <span aria-hidden="true">✦</span> Cancel Anytime
        </p>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className="mt-16 flex flex-col items-center gap-2 opacity-25 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <span
            className="text-[10px] uppercase"
            style={{ letterSpacing: "0.2em", color: "var(--text-tertiary)" }}
          >
            Scroll
          </span>
          <div
            className="h-10 w-px"
            style={{
              background:
                "linear-gradient(to bottom, var(--text-tertiary), transparent)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
