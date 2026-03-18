"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { PLANS, type PlanDisplay, type PlanTier } from "@/lib/stripe-prices";

/**
 * /quiz/result — Shows the recommended tier after quiz completion.
 *
 * Reads `tier` from query params (set by /quiz form).
 * Displays the recommended plan, its features, and CTA to /apply?tier={tier}.
 * Falls back to "coaching" if tier is invalid.
 *
 * Fires `quiz_result_viewed` analytics event on mount.
 */

const VALID_TIERS: PlanTier[] = ["foundation", "coaching", "performance", "vip"];

function ResultContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier") ?? "coaching";

  const tier: PlanTier = VALID_TIERS.includes(tierParam as PlanTier)
    ? (tierParam as PlanTier)
    : "coaching";

  const plan: PlanDisplay = PLANS.find((p) => p.tier === tier) ?? PLANS[1]; // fallback to coaching

  const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

  const perMonth =
    billingInterval === "annual"
      ? Math.round(plan.annualPrice / 12)
      : plan.monthlyPrice;
  const totalPrice =
    billingInterval === "monthly" ? plan.monthlyPrice : plan.annualPrice;

  useEffect(() => {
    track({ name: "quiz_result_viewed", properties: { tier } });
  }, [tier]);

  return (
    <main className="min-h-screen text-black flex flex-col" style={{ background: "#FAFAF9" }}>
      {/* Shimmer progress bar — signals completion */}
      <div className="w-full bg-neutral-100 h-1">
        <div
          className="h-1 w-full animate-shimmer"
          style={{
            background: "linear-gradient(90deg, #000 0%, #555 50%, #000 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Recommendation header */}
          <div className="text-center mb-8 animate-slide-up">
            <p
              className="text-xs font-semibold text-neutral-400 mb-3 uppercase"
              style={{ letterSpacing: "0.12em" }}
            >
              Your Recommended Plan
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold"
              style={{ letterSpacing: "-0.03em" }}
            >
              {plan.name}
            </h1>
            <p className="mt-2 text-neutral-500 text-base">{plan.tagline}</p>
          </div>

          {/* Plan card — shimmer gradient border */}
          <div
            className="p-px rounded-2xl mb-6 animate-slide-up"
            style={{
              animationDelay: "100ms",
              background: "linear-gradient(135deg, #000 0%, #555 50%, #000 100%)",
              backgroundSize: "200% 200%",
              animation: "shimmer 3s linear infinite, slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1) 100ms both",
            }}
          >
            <div className="rounded-[calc(1rem-1px)] bg-white p-6">
              {/* Billing toggle */}
              <div
                className="flex items-center justify-center gap-3 mb-6"
                role="group"
                aria-label="Billing interval"
              >
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  aria-pressed={billingInterval === "monthly"}
                  className={`text-sm font-medium transition-colors ${
                    billingInterval === "monthly"
                      ? "text-black"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBillingInterval((prev) =>
                      prev === "monthly" ? "annual" : "monthly"
                    )
                  }
                  className="relative inline-flex h-6 w-11 items-center rounded-full border border-neutral-300 transition-colors duration-200"
                  style={{
                    backgroundColor:
                      billingInterval === "annual" ? "#000" : "#f5f5f5",
                  }}
                  aria-label="Toggle annual billing"
                  aria-pressed={billingInterval === "annual"}
                >
                  <span
                    className="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
                    style={{
                      transform:
                        billingInterval === "annual"
                          ? "translateX(22px)"
                          : "translateX(2px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("annual")}
                  aria-pressed={billingInterval === "annual"}
                  className={`text-sm font-medium transition-colors ${
                    billingInterval === "annual"
                      ? "text-black"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  Annual
                </button>
                {billingInterval === "annual" && (
                  <span className="ml-2 rounded-full bg-black px-2.5 py-0.5 text-xs font-medium text-white">
                    Save ~17%
                  </span>
                )}
              </div>

              {/* Price — typographic scale trick: $ small, number dominant */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-light text-neutral-400">$</span>
                  <span
                    className="text-6xl font-bold"
                    style={{ letterSpacing: "-0.04em" }}
                  >
                    {perMonth}
                  </span>
                  <span className="text-base text-neutral-400 self-end mb-2">/mo</span>
                </div>
                {billingInterval === "annual" && (
                  <p className="mt-1 text-xs text-neutral-400">
                    ${totalPrice}/yr, billed annually
                  </p>
                )}
              </div>

              {/* Features — black circle checkmarks */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span
                      className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-black text-white text-[10px] font-bold"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={`/apply?tier=${tier}`}
                className="block w-full rounded-2xl bg-black px-6 py-4 text-white font-semibold text-base text-center transition-all hover:bg-neutral-800 hover:shadow-lg"
              >
                Join the Waitlist →
              </Link>
            </div>
          </div>

          {/* Waitlist note */}
          <p className="text-center text-sm text-neutral-500 mb-6">
            We&apos;re currently onboarding founding members. Apply now to lock in early-access pricing.
          </p>

          {/* Secondary CTAs */}
          <div className="text-center space-y-3">
            <Link
              href="/#pricing"
              className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
            >
              Compare all plans ↓
            </Link>
            <p className="text-xs text-neutral-400">
              30-day satisfaction guarantee · Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function QuizResultPage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#FAFAF9" }}
        >
          <p className="text-neutral-400">Loading your result…</p>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
