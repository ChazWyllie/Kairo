"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const COACHING_STEPS = [
  {
    title: "Apply and share your reality",
    description:
      "Tell us your schedule, equipment, stress level, and goals. A quick form so your coach understands where you actually are, not where you think you should be.",
  },
  {
    title: "Get your personalized plan",
    description:
      "Your coach builds a training and nutrition plan around your real life. Workout options, protein targets, and guidance that fits your week, not an idealized one.",
  },
  {
    title: "Check in. It adapts.",
    description:
      "Short weekly check-ins keep your coach informed. Busy week? Travel? Bad sleep? Your plan updates accordingly. Consistency compounds when the plan bends instead of breaks.",
  },
] as const;

const TEMPLATE_STEPS = [
  {
    title: "Choose your guide",
    description:
      "Pick the workout, nutrition, or supplement guide that fits your goals. Or grab the complete bundle and save.",
  },
  {
    title: "Checkout in 30 seconds",
    description:
      "Pay securely with Stripe. No account needed. Your guide arrives in your inbox instantly.",
  },
  {
    title: "Start seeing results",
    description:
      "Follow the evidence-based plan. Ready for personalized support? Upgrade to coaching anytime.",
  },
] as const;

const STEP_NUMBERS = ["01", "02", "03"] as const;

type Tab = "coaching" | "templates";

/**
 * Three-step process section with tab toggle for coaching vs. templates path.
 * Tab switch crossfades (200ms opacity transition).
 * All existing ScrollReveal, step number, and connecting line styles are preserved.
 */
export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState<Tab>("coaching");

  const steps = activeTab === "coaching" ? COACHING_STEPS : TEMPLATE_STEPS;

  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-tertiary)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <ScrollReveal className="mb-10 md:mb-12">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            The process
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Simple by design.
          </h2>
        </ScrollReveal>

        {/* Tab toggle */}
        <div className="mb-12" style={{ display: "flex", gap: "4px", width: "fit-content" }}>
          {(["coaching", "templates"] as const).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 400,
                  cursor: "pointer",
                  background: isActive ? "var(--bg-secondary)" : "transparent",
                  color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                  borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
                  transition: "background 0.15s ease, color 0.15s ease",
                  textTransform: "capitalize",
                }}
                aria-pressed={isActive}
              >
                {tab === "coaching" ? "Coaching" : "Templates"}
              </button>
            );
          })}
        </div>

        {/* Steps grid — crossfade on tab switch */}
        <div
          className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8"
          style={{ transition: "opacity 0.2s ease", opacity: 1 }}
          key={activeTab}
        >
          {/* Desktop connecting line */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-px"
            style={{
              background:
                "linear-gradient(to right, transparent, var(--border-subtle) 20%, var(--border-subtle) 80%, transparent)",
            }}
          />

          {steps.map((step, i) => (
            <ScrollReveal
              key={step.title}
              delay={i * 150}
              className="relative flex flex-col gap-5"
            >
              {/* Large faint step number */}
              <div className="relative">
                <span
                  className="font-display font-black leading-none select-none"
                  style={{
                    fontSize: "5rem",
                    color: "var(--accent-primary)",
                    opacity: 0.12,
                    lineHeight: 1,
                  }}
                  aria-hidden="true"
                >
                  {STEP_NUMBERS[i]}
                </span>
                {/* Dot on the connecting line (desktop only) */}
                <span
                  aria-hidden="true"
                  className="hidden md:block absolute top-8 left-0 w-2 h-2 rounded-full"
                  style={{ background: "var(--accent-primary)", opacity: 0.6 }}
                />
              </div>

              <div>
                <h3
                  className="font-display font-bold text-xl mb-3"
                  style={{
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
