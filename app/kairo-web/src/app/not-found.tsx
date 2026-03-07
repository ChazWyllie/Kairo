import Link from "next/link";

/**
 * Custom 404 page — friendly fallback for unknown routes.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6 animate-fade-in-up">
        <div className="text-7xl font-bold tracking-tighter text-[var(--foreground-muted)]">
          404
        </div>
        <p className="text-[var(--foreground-secondary)]">
          This page doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="btn-primary"
          >
            Go home
          </Link>
          <Link
            href="/quiz"
            className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Take the quiz →
          </Link>
        </div>
      </div>
    </main>
  );
}
