"use client";

import Link from "next/link";

/**
 * /apply/status — Holding page for applicants who have registered but are still pending review.
 *
 * Shown after a successful registration when the member status is "pending".
 * Once the coach approves the application, the member will be upgraded to "active"
 * and can access the full dashboard.
 */
export default function ApplicationStatusPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-5 py-16"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="w-full max-w-md text-center">
        <div
          className="inline-flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold mb-6"
          style={{ background: "var(--bg-secondary)", color: "var(--accent-primary)", border: "1px solid var(--border-subtle)" }}
        >
          ⏳
        </div>

        <h1
          className="font-display font-black text-3xl mb-3"
          style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}
        >
          Account Created
        </h1>

        <p className="text-base mb-2" style={{ color: "var(--text-secondary)" }}>
          Your account is ready. We are reviewing your application and will reach out within 24 to 48 hours.
        </p>
        <p className="text-sm mb-10" style={{ color: "var(--text-tertiary)" }}>
          You can sign in at any time. Your dashboard will unlock once you are approved.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full rounded-[var(--radius-md)] py-4 text-base font-semibold text-center transition-all duration-200 block"
            style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="text-sm text-center transition-colors duration-150"
            style={{ color: "var(--text-tertiary)" }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
