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
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-neutral-600 text-sm">
          We hit an unexpected error. Please try again. If the problem persists,
          reach out to us on Instagram.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
