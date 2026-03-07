import Link from "next/link";

/**
 * Post-checkout success page.
 * Shown after Stripe Checkout redirects back.
 * Note: membership activation is handled by the webhook, not this page.
 */
export default function SuccessPage() {
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

        <Link
          href="/"
          className="mt-8 inline-block rounded-xl bg-black px-6 py-3 text-white font-medium"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
