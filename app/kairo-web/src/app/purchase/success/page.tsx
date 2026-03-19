"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Post-purchase success page for template purchases.
 * Stripe redirects here with ?session_id=xxx after a successful checkout.
 * Shows a confirmation + coaching upsell to convert template buyers.
 */
function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // If no session_id, show a generic confirmation (direct URL visit)
  void sessionId;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className="font-display font-bold tracking-[0.15em] text-sm uppercase mb-16"
        style={{ color: "var(--text-tertiary)", letterSpacing: "0.15em" }}
      >
        Kairo
      </Link>

      {/* Checkmark */}
      <div
        className="animate-scale-in mb-8 flex items-center justify-center rounded-full"
        style={{
          width: "72px",
          height: "72px",
          background: "rgba(224,255,79,0.1)",
          border: "2px solid var(--accent-primary)",
        }}
      >
        <span
          style={{ fontSize: "2rem", color: "var(--accent-primary)" }}
          aria-hidden="true"
        >
          ✓
        </span>
      </div>

      {/* Confirmation */}
      <div className="text-center mb-4">
        <h1
          className="font-display font-black"
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          You&apos;re in. Check your inbox.
        </h1>
        <p
          className="text-base max-w-sm mx-auto leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          Your guide is on its way. Check your spam folder if you don&apos;t
          see it within a few minutes.
        </p>
      </div>

      <p className="text-sm mb-10" style={{ color: "var(--text-tertiary)" }}>
        Didn&apos;t receive it?{" "}
        <a
          href="mailto:support@kairo.business"
          className="link-underline"
          style={{ color: "var(--text-secondary)" }}
        >
          Email support@kairo.business
        </a>
      </p>

      {/* Coaching upsell card */}
      <div
        className="w-full max-w-md mb-10"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-[0.1em] mb-3"
          style={{ color: "var(--accent-primary)" }}
        >
          Take it further
        </p>
        <h2
          className="font-display font-bold mb-2"
          style={{ fontSize: "1.125rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Want personalized coaching that adapts to your life?
        </h2>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Template buyers get priority access to founding member pricing. Apply today and lock it in.
        </p>
        <Link
          href="/#coaching"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-px btn-glow"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          Learn About Coaching
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="text-sm link-underline"
        style={{ color: "var(--text-tertiary)" }}
      >
        Back to Kairo
      </Link>
    </div>
  );
}

export default function PurchaseSuccessPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-primary)", color: "var(--text-tertiary)" }}
        >
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
