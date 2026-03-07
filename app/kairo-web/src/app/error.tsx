"use client";

/**
 * Global error boundary — catches unhandled React errors.
 *
 * Keeps users informed instead of showing a blank white page.
 * Renders a minimal recovery UI with a retry button.
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6 animate-fade-in-up">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-3xl">
          ⚠️
        </div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
          We hit an unexpected error. Please try again — if the problem persists,
          reach out to us on Instagram.
        </p>
        <button
          type="button"
          onClick={reset}
          className="btn-primary"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
