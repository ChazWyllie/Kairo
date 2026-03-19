"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { COACHING_TIERS } from "@/lib/products";
import type { PlanTier } from "@/lib/stripe-prices";

/**
 * /quiz/result — Shows the recommended tier after quiz completion.
 *
 * Reads `tier` from query params (set by /quiz form).
 * Displays the recommended plan, its features, and CTA to /apply?tier={tier}.
 * Falls back to "standard" if tier is invalid.
 *
 * Fires `quiz_result_viewed` analytics event on mount.
 */

const VALID_TIERS: PlanTier[] = ["standard", "premium"];

function ResultContent() {
  const searchParams = useSearchParams();
  const tierParam = searchParams.get("tier") ?? "standard";

  const tier: PlanTier = VALID_TIERS.includes(tierParam as PlanTier)
    ? (tierParam as PlanTier)
    : "standard";

  const plan = COACHING_TIERS[tier as keyof typeof COACHING_TIERS] ?? COACHING_TIERS.standard;

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
            className="p-px rounded-2xl mb-6"
            style={{
              background: "linear-gradient(135deg, #000 0%, #555 50%, #000 100%)",
              backgroundSize: "200% 200%",
              animation: "shimmer 3s linear infinite, slide-up 0.5s cubic-bezier(0.19, 1, 0.22, 1) 100ms both",
            }}
          >
            <div className="rounded-[calc(1rem-1px)] bg-white p-6">
              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-light text-neutral-400">$</span>
                  <span
                    className="text-6xl font-bold"
                    style={{ letterSpacing: "-0.04em" }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-base text-neutral-400 self-end mb-2">/mo</span>
                </div>
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
                Apply Now →
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
              href="/#coaching"
              className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
            >
              See coaching plans ↓
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
