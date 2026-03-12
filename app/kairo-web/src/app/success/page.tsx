import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Payment Successful | Kairo",
  description: "Your Kairo Coaching membership is being activated. Check your email for next steps.",
};
import Link from "next/link";

export const dynamic = "force-dynamic";

/**
 * Post-checkout success page.
 * Shown after Stripe Checkout redirects back.
 * Note: membership activation is handled by the webhook, not this page.
 */
export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-black">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <p className="text-neutral-600">Loading…</p>
          </div>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold">You&apos;re in ✅</h1>
        <p className="mt-4 text-neutral-700">
          Thanks for joining Kairo Coaching. Your membership will activate
          automatically once payment is confirmed.
        </p>
        <p className="mt-2 text-neutral-700">
          You&apos;ll receive next steps by email shortly.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/onboarding"
            className="rounded-xl bg-black px-6 py-3 text-white font-medium"
          >
            Complete onboarding →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-neutral-300 px-6 py-3 font-medium hover:border-neutral-500"
          >
            View dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
