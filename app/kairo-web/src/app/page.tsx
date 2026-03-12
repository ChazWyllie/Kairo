import type { Metadata } from "next";
import WaitlistHero from "@/components/WaitlistHero";

// When ready to launch: replace WaitlistHero + this page with <FullHomePage />
// import FullHomePage from "@/components/FullHomePage";

export const metadata: Metadata = {
  title: "Kairo | Personalized Fitness Coaching",
  description:
    "Expert fitness coaching that adapts to your life. Join the waitlist for early access and founding member pricing.",
};

/**
 * Waitlist landing page — minimal hero with CTA to /apply.
 *
 * Replaces the full homepage (hero, social proof, pricing, trust)
 * during pre-launch. The original content is preserved in
 * src/components/FullHomePage.tsx for easy swap-back.
 */
export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-black text-white">
      <WaitlistHero />

      {/* Disclaimer + Footer */}
      <div className="mx-auto max-w-3xl px-6 pb-12">
        <div className="rounded-xl bg-neutral-900 p-4 text-sm text-neutral-400 text-center">
          <p className="font-medium text-neutral-300">Note:</p>
          <p>
            This is fitness coaching and general nutrition guidance, not medical
            advice.
          </p>
        </div>
        <div className="mt-6 text-center text-sm text-neutral-600">
          <p>
            &copy; {new Date().getFullYear()} Kairo Coaching. All rights
            reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
