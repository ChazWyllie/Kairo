import type { Metadata } from "next";
import MobileNav from "@/components/marketing/mobile/MobileNav";
import AppShowcase from "@/components/marketing/mobile/AppShowcase";
import MobileWaitlist from "@/components/marketing/mobile/MobileWaitlist";
import MobileFooter from "@/components/marketing/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "Kairo App Features -- Today, Log, and Insights",
  description:
    "Three screens. Everything you need, nothing you don't. Explore the Today, Log, and Insights screens of the Kairo fitness app.",
};

/**
 * Features deep-dive page.
 * Shows the three app screens with descriptive copy for each.
 */
export default function FeaturesPage() {
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
            The app
          </p>
          <h1
            className="font-display font-black leading-none mb-6"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              letterSpacing: "-0.04em",
              color: "var(--text-primary)",
            }}
          >
            Three screens.
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}> That's it.</span>
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Kairo strips out everything that doesn&apos;t help you stay consistent.
            Today tells you what to do. Log tracks what you did. Insights shows your progress.
          </p>
        </div>
      </section>

      {/* Feature descriptions */}
      <section
        className="py-16 px-5 md:px-10"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            {
              label: "Today",
              headline: "Your plan for right now",
              body: "Set your constraints -- time, equipment, energy -- and get 2 to 3 workout options plus a protein target. Swap options, start your workout, or change your constraints. Everything updates instantly.",
            },
            {
              label: "Log",
              headline: "Thirty seconds, done",
              body: "Tap to check off your workout, meals, water, and steps. Missed something? Hit \"I missed\" and tomorrow's plan adjusts without guilt. No journals, no lengthy forms, no streaks that reset you to zero.",
            },
            {
              label: "Insights",
              headline: "Progress that makes sense",
              body: "See your streak, adherence score, and weekly summary at a glance. Smart nudges surface when you're close to a target. Tomorrow's preview lets you plan ahead without any extra work.",
            },
          ].map((feature) => (
            <div
              key={feature.label}
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "28px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--accent-primary)",
                }}
              >
                {feature.label}
              </span>
              <h3
                className="font-display font-bold"
                style={{ fontSize: "1.125rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}
              >
                {feature.headline}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Live phone showcase */}
      <AppShowcase />

      <MobileWaitlist />
      <MobileFooter />
    </main>
  );
}
