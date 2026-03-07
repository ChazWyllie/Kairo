import Link from "next/link";

/**
 * Custom 404 page — friendly fallback for unknown routes.
 */
export default function NotFound() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-neutral-600">
          This page doesn&apos;t exist. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-black px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Go home
          </Link>
          <Link
            href="/quiz"
            className="text-sm font-medium text-neutral-500 hover:text-black transition-colors"
          >
            Take the quiz →
          </Link>
        </div>
      </div>
    </main>
  );
}
