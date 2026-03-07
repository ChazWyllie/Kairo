/**
 * Quiz flow loading skeleton — shown during server component resolution.
 */
export default function QuizLoading() {
  return (
    <main className="min-h-screen bg-white text-black flex flex-col">
      {/* Progress bar placeholder */}
      <div className="w-full bg-neutral-100 h-1.5">
        <div className="h-1.5 bg-neutral-200 w-1/3 animate-pulse" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6 animate-pulse">
          {/* Question placeholder */}
          <div className="h-8 bg-neutral-100 rounded-lg w-3/4 mx-auto" />
          {/* Option placeholders */}
          <div className="space-y-3">
            <div className="h-14 bg-neutral-100 rounded-xl" />
            <div className="h-14 bg-neutral-100 rounded-xl" />
            <div className="h-14 bg-neutral-100 rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
