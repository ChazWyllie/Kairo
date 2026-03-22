import type { Metadata } from "next";
import MobileNav from "@/components/marketing/mobile/MobileNav";
import MobileHowItWorks from "@/components/marketing/mobile/MobileHowItWorks";
import MobileWaitlist from "@/components/marketing/mobile/MobileWaitlist";
import MobileFooter from "@/components/marketing/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "How Kairo Works -- Set Constraints, Get a Plan, Log in 30 Seconds",
  description:
    "Three steps, zero friction. Tell Kairo what you have to work with, get a daily plan, and log your progress in seconds.",
};

/**
 * Expanded How It Works page for the mobile app.
 * Shows the full 3-step explanation with additional context.
 */
export default function HowItWorksPage() {
  return (
    <main className="bg-bg-primary min-h-screen">
      <MobileNav />

      {/* Page header */}
      <section
        className="pt-32 pb-8 px-5 md:px-10 text-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="mx-auto max-w-3xl">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            The process
          </p>
          <h1
            className="font-display font-black leading-none mb-6"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
            }}
          >
            Built for the week you actually have.
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Most fitness apps assume you have unlimited time, a gym around the corner,
            and zero stress. Kairo starts with reality and builds from there.
          </p>
        </div>
      </section>

      {/* Reuse the step cards section */}
      <MobileHowItWorks />

      {/* Extended explanation */}
      <section
        className="py-20 px-5 md:px-10"
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                title: "No perfect week required",
                body: "Kairo works around missed days, travel, low energy, and short windows. Toggle your constraints each morning and the plan updates. Missed yesterday? Tomorrow adjusts automatically.",
              },
              {
                title: "Constraint-first planning",
                body: "Instead of giving you a rigid 12-week program, Kairo asks what you have to work with right now. Time, equipment, sleep quality, stress -- all of it shapes what you get today.",
              },
              {
                title: "Logging that takes 30 seconds",
                body: "Check off your workout, meals, water, and steps. That is it. No essays, no calorie tracking, no guilt. The data feeds tomorrow's plan automatically.",
              },
              {
                title: "Consistency as the goal",
                body: "Streaks and adherence scores reward showing up, not perfection. A 20-minute hotel workout counts. A missed meal is just data. The system is designed to keep you moving, not to judge you.",
              },
            ].map((item) => (
              <div key={item.title} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <h3
                  className="font-display font-bold text-lg"
                  style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
                >
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MobileWaitlist />
      <MobileFooter />
    </main>
  );
}
