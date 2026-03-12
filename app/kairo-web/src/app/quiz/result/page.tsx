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
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Completed progress bar */}
      <div className="w-full bg-neutral-100 h-1.5">
        <div className="h-1.5 bg-black w-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Recommendation header */}
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-neutral-400 uppercase tracking-wide mb-2">
              Your Recommended Plan
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold">{plan.name}</h1>
            <p className="mt-2 text-lg text-neutral-600">{plan.tagline}</p>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl border border-black ring-2 ring-black p-6 shadow-sm mb-6">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-3 mb-6" role="group" aria-label="Billing interval">
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                aria-pressed={billingInterval === "monthly"}
                className={`text-sm font-medium transition-colors ${billingInterval === "monthly" ? "text-black" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() =>
                  setBillingInterval((prev) => (prev === "monthly" ? "annual" : "monthly"))
                }
                className="relative inline-flex h-7 w-12 items-center rounded-full transition-colors"
                style={{ backgroundColor: billingInterval === "annual" ? "#000" : "#d4d4d4" }}
                aria-label="Toggle annual billing"
                aria-pressed={billingInterval === "annual"}
              >
                <span
                  className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
                  style={{
                    transform: billingInterval === "annual" ? "translateX(24px)" : "translateX(4px)",
                  }}
                />
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("annual")}
                aria-pressed={billingInterval === "annual"}
                className={`text-sm font-medium transition-colors ${billingInterval === "annual" ? "text-black" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                Annual
              </button>
              {billingInterval === "annual" && (
                <span className="ml-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  Save ~17%
                </span>
              )}
            </div>

            {/* Price */}
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">${perMonth}</span>
              <span className="text-neutral-500">/mo</span>
              {billingInterval === "annual" && (
                <p className="mt-1 text-xs text-neutral-500">
                  ${totalPrice}/yr, billed annually
                </p>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <span className="text-green-600 shrink-0 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Waitlist CTA */}
            <Link
              href={`/apply?tier=${tier}`}
              className="block w-full rounded-xl bg-black px-6 py-3.5 text-white font-semibold text-base text-center transition-opacity hover:opacity-80"
            >
              Join the Waitlist →
            </Link>
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
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-neutral-400">Loading your result…</p>
        </main>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
