import { Suspense } from "react";
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
        <main className="min-h-screen bg-[var(--background)]">
          <div className="mx-auto max-w-2xl px-6 py-16">
            <div className="skeleton h-8 w-48 mb-4" />
            <div className="skeleton h-4 w-80" />
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
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="animate-scale-in">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl mb-6">
            ✅
          </div>
          <h1 className="text-3xl font-bold tracking-tight">You&apos;re in!</h1>
          <p className="mt-4 text-[var(--foreground-secondary)] leading-relaxed">
            Thanks for joining Kairo Coaching. Your membership will activate
            automatically once payment is confirmed.
          </p>
          <p className="mt-2 text-[var(--foreground-secondary)] leading-relaxed">
            You&apos;ll receive next steps by email shortly.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/onboarding"
              className="btn-primary"
            >
              Complete onboarding →
            </Link>
            <Link
              href="/dashboard"
              className="btn-secondary"
            >
              View dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
