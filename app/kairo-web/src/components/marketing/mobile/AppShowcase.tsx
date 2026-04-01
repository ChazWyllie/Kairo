"use client";

import { motion } from "framer-motion";
import PhoneFrame from "@/components/ui/PhoneFrame";
import TodayScreen from "@/components/ui/TodayScreen";
import LogScreen from "@/components/ui/LogScreen";
import InsightsScreen from "@/components/ui/InsightsScreen";

const PHONES = [
  {
    screen: <TodayScreen />,
    label: "Today",
    sublabel: "Set your constraints, get a plan",
    tiltDeg: -5,
    floatDelay: "0s",
  },
  {
    screen: <LogScreen />,
    label: "Log",
    sublabel: "Check off in 30 seconds",
    tiltDeg: 0,
    floatDelay: "1s",
  },
  {
    screen: <InsightsScreen />,
    label: "Insights",
    sublabel: "Track streaks and adherence",
    tiltDeg: 5,
    floatDelay: "2s",
  },
] as const;

/**
 * Three-phone showcase section.
 * Desktop: three phones side-by-side with perspective tilt fan effect.
 * Mobile: stacked vertically (one phone per label row).
 * Each phone loops its screen content independently.
 */
export default function AppShowcase() {
  return (
    <section
      className="py-24 md:py-32 px-5 md:px-10 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background accent glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(60px)",
        }}
      />

      <div className="mx-auto max-w-6xl relative">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            The app
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Designed for your real life.
          </h2>
          <p
            className="mt-4 mx-auto max-w-md text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Three screens. Everything you need, nothing you don&apos;t.
          </p>
        </motion.div>

        {/* Phones container -- perspective applied here, not on individual frames */}
        <div
          className="hidden md:flex items-center justify-center gap-8"
          style={{ perspective: "1200px" }}
        >
          {PHONES.map((phone, i) => (
            <motion.div
              key={phone.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
                delay: i * 0.1,
              }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}
            >
              <PhoneFrame tiltDeg={phone.tiltDeg} floatDelay={phone.floatDelay}>
                {phone.screen}
              </PhoneFrame>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {phone.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                  {phone.sublabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: stacked phones */}
        <div className="flex flex-col md:hidden items-center gap-12">
          {PHONES.map((phone, i) => (
            <motion.div
              key={phone.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.08 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
            >
              <PhoneFrame tiltDeg={0} floatDelay={phone.floatDelay}>
                {phone.screen}
              </PhoneFrame>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {phone.label}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "2px" }}>
                  {phone.sublabel}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
