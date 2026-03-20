import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Payment Successful | Kairo",
  description: "Your Kairo Fitness membership is being activated. Check your email for next steps.",
};
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Post-checkout success page.
 * Shown after Stripe Checkout redirects back.
 * Note: membership activation is handled by the webhook, not this page.
 */
export default function SuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const sessionId =
    typeof searchParams.session_id === "string"
      ? searchParams.session_id
      : undefined;

  if (!sessionId || !sessionId.startsWith("cs_")) {
    redirect("/");
  }

  const isFoundingMember = searchParams.founding === "true";

  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--bg-primary)", color: "var(--text-tertiary)" }}
        >
          Loading…
        </main>
      }
    >
      <SuccessContent isFoundingMember={isFoundingMember} />
    </Suspense>
  );
}

function SuccessContent({ isFoundingMember }: { isFoundingMember: boolean }) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Wordmark */}
      <Link
        href="/"
        className="font-display font-bold tracking-[0.15em] text-sm uppercase mb-16"
        style={{ color: "var(--text-tertiary)" }}
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
        <span style={{ fontSize: "2rem", color: "var(--accent-primary)" }} aria-hidden="true">
          ✓
        </span>
      </div>

      {/* Confirmation */}
      <div className="text-center mb-8 max-w-md">
        <h1
          className="font-display font-black"
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            marginBottom: "12px",
          }}
        >
          {isFoundingMember ? "You're a Founding Member." : "You're in."}
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {isFoundingMember
            ? "Your 10% lifetime discount is locked in. Check your email for next steps."
            : "Your membership is activating. Check your email for next steps."}
        </p>
      </div>

      {/* Set up account CTA */}
      <div
        className="w-full max-w-md mb-6"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-lg)",
          padding: "28px",
        }}
      >
        <p
          className="text-xs font-medium uppercase tracking-[0.1em] mb-2"
          style={{ color: "var(--accent-primary)" }}
        >
          Next step
        </p>
        <h2
          className="font-display font-bold mb-2"
          style={{ fontSize: "1.125rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}
        >
          Set up your account
        </h2>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          Create a password to log in to your coaching dashboard, track your progress,
          and submit weekly check-ins.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-6 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-px"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          Create account
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="text-sm"
        style={{ color: "var(--text-tertiary)" }}
      >
        Back to Kairo
      </Link>
    </main>
  );
}
