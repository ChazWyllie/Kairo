/**
 * Quiz flow loading skeleton — shown during server component resolution.
 */
export default function QuizLoading() {
  return (
    <main className="min-h-screen bg-gradient-hero flex flex-col">
      {/* Progress bar placeholder */}
      <div className="w-full bg-white/10 h-1.5">
        <div className="h-1.5 bg-amber-500/30 w-1/3" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Question placeholder */}
          <div className="skeleton h-8 w-3/4 mx-auto opacity-30" />
          {/* Option placeholders */}
          <div className="space-y-3">
            <div className="skeleton h-14 w-full opacity-20" />
            <div className="skeleton h-14 w-full opacity-20" />
            <div className="skeleton h-14 w-full opacity-20" />
          </div>
        </div>
      </div>
    </main>
  );
}
