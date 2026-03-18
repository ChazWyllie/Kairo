"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { PLANS } from "@/lib/stripe-prices";

// Founding discount: 10% off forever
function foundingPrice(original: number) {
  return Math.round(original * 0.9);
}

/**
 * Pricing section — shows all four real tiers from stripe-prices.ts.
 * Coaching tier is highlighted as the most popular.
 * Monthly/annual toggle. Founding member discount (10% off) shown on each card.
 */
export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section
      id="pricing"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-tertiary)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <ScrollReveal className="text-center mb-14">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            Pricing
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Choose your level
            <br />
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
              of support.
            </span>
          </h2>
          <p
            className="mt-4 mx-auto max-w-md text-base"
            style={{ color: "var(--text-secondary)" }}
          >
            All plans include personalized training and nutrition. Upgrade or cancel anytime.
          </p>
        </ScrollReveal>

        {/* Billing toggle */}
        <ScrollReveal delay={80} className="flex items-center justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            aria-pressed={!isAnnual}
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: isAnnual ? "var(--text-tertiary)" : "var(--text-primary)" }}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setIsAnnual((v) => !v)}
            aria-label="Toggle annual billing"
            aria-pressed={isAnnual}
            className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200"
            style={{ background: isAnnual ? "var(--accent-primary)" : "var(--border-hover)" }}
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 shadow-sm"
              style={{ transform: isAnnual ? "translateX(24px)" : "translateX(4px)" }}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            aria-pressed={isAnnual}
            className="text-sm font-medium transition-colors duration-150"
            style={{ color: isAnnual ? "var(--text-primary)" : "var(--text-tertiary)" }}
          >
            Annual
          </button>

          {isAnnual && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                background: "rgba(224,255,79,0.1)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(224,255,79,0.2)",
              }}
            >
              Save ~17%
            </span>
          )}
        </ScrollReveal>

        {/* Tier grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan, i) => {
            const isHighlighted = plan.tier === "coaching";
            const originalPrice = isAnnual
              ? Math.round(plan.annualPrice / 12)
              : plan.monthlyPrice;
            const discounted = foundingPrice(originalPrice);

            return (
              <ScrollReveal key={plan.tier} delay={i * 80}>
                {/* Gradient border on highlighted card, plain border otherwise */}
                <div
                  className="h-full"
                  style={
                    isHighlighted
                      ? {
                          background:
                            "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)",
                          padding: "1px",
                          borderRadius: "var(--radius-lg)",
                        }
                      : {
                          background: "var(--border-subtle)",
                          padding: "1px",
                          borderRadius: "var(--radius-lg)",
                        }
                  }
                >
                  <div
                    className="h-full flex flex-col rounded-[calc(var(--radius-lg)-1px)] p-6"
                    style={{ background: "var(--bg-secondary)" }}
                  >
                    {/* Most popular badge */}
                    {isHighlighted && (
                      <span
                        className="self-start rounded-full px-3 py-1 text-xs font-medium mb-4"
                        style={{
                          background: "rgba(224,255,79,0.1)",
                          color: "var(--accent-primary)",
                          border: "1px solid rgba(224,255,79,0.2)",
                        }}
                      >
                        Most Popular
                      </span>
                    )}

                    <h3
                      className="font-display font-bold text-lg mb-1"
                      style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className="text-xs mb-5"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {plan.tagline}
                    </p>

                    {/* Price */}
                    <div className="mb-1">
                      <span
                        className="font-display font-black"
                        style={{
                          fontSize: "2.5rem",
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                          color: "var(--text-primary)",
                        }}
                      >
                        ${discounted}
                      </span>
                      <span
                        className="text-sm ml-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        /mo
                      </span>
                    </div>
                    <p className="text-xs mb-6" style={{ color: "var(--text-tertiary)" }}>
                      <span style={{ textDecoration: "line-through" }}>
                        ${originalPrice}/mo
                      </span>
                      {" "}founding price
                      {isAnnual && " · billed annually"}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5">
                          <span
                            className="shrink-0 text-sm font-bold mt-0.5"
                            style={{ color: "var(--accent-primary)" }}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                          <span
                            className="text-sm leading-snug"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={`/apply?tier=${plan.tier}`}
                      onClick={() =>
                        track({
                          name: "cta_click",
                          properties: { location: `pricing_${plan.tier}` },
                        })
                      }
                      className="block w-full text-center rounded-[var(--radius-md)] py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-px"
                      style={
                        isHighlighted
                          ? {
                              background: "var(--accent-primary)",
                              color: "var(--bg-primary)",
                            }
                          : {
                              background: "transparent",
                              color: "var(--text-primary)",
                              border: "1px solid var(--border-hover)",
                            }
                      }
                    >
                      Apply Now
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={200} className="text-center mt-8">
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            No commitment required. Cancel anytime. Founding pricing locks in forever.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
