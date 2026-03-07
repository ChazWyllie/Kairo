/**
 * Result page loading skeleton — shown while Suspense resolves searchParams.
 */
export default function ResultLoading() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Full progress bar */}
      <div className="w-full bg-neutral-100 h-1.5">
        <div className="h-1.5 bg-black w-full" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg space-y-6 animate-pulse">
          {/* Header placeholder */}
          <div className="text-center space-y-3">
            <div className="h-4 bg-neutral-100 rounded w-1/3 mx-auto" />
            <div className="h-10 bg-neutral-100 rounded-lg w-1/2 mx-auto" />
            <div className="h-5 bg-neutral-100 rounded w-2/3 mx-auto" />
          </div>
          {/* Plan card placeholder */}
          <div className="rounded-2xl border border-neutral-200 p-6 space-y-4">
            <div className="h-8 bg-neutral-100 rounded w-1/3 mx-auto" />
            <div className="space-y-3">
              <div className="h-4 bg-neutral-100 rounded" />
              <div className="h-4 bg-neutral-100 rounded" />
              <div className="h-4 bg-neutral-100 rounded w-3/4" />
            </div>
            <div className="h-12 bg-neutral-100 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
