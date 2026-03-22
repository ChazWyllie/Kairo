"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import PhoneFrame from "@/components/ui/PhoneFrame";
import TodayScreen from "@/components/ui/TodayScreen";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

/**
 * Full-viewport hero for the mobile app landing page.
 * Desktop: two-column layout -- headline left, TodayScreen phone mockup right.
 * Mobile: stacked -- headline then phone.
 * Staggered entrance with Framer Motion on page load.
 */
export default function MobileHero() {
  return (
    <section
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-bg-primary"
      aria-label="Hero"
    >
      {/* Grid background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 100% 80% at 50% 0%, black 20%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 100% 80% at 50% 0%, black 20%, transparent 100%)",
        }}
      />

      {/* Accent glow behind phone */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute z-0 animate-orb-pulse"
        style={{
          width: "600px",
          height: "600px",
          top: "50%",
          right: "-100px",
          transform: "translateY(-50%)",
          background:
            "radial-gradient(circle, rgba(224,255,79,0.07) 0%, transparent 65%)",
          borderRadius: "50%",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-10 pt-28 pb-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center"
        >
          {/* Left: copy */}
          <div className="flex flex-col gap-8">
            {/* Eyebrow */}
            <motion.p
              variants={itemVariants}
              className="text-xs font-medium uppercase tracking-[0.15em]"
              style={{ color: "var(--accent-primary)" }}
            >
              Kairo Mobile App
            </motion.p>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-display font-black leading-none"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5rem)",
                letterSpacing: "-0.04em",
              }}
            >
              <span className="block" style={{ color: "var(--text-primary)" }}>
                Fitness that adapts
              </span>
              <span
                className="block font-normal"
                style={{ color: "var(--text-tertiary)" }}
              >
                when life happens.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="text-base sm:text-lg leading-relaxed"
              style={{ color: "var(--text-secondary)", maxWidth: "460px" }}
            >
              Tell Kairo your constraints. Get a plan that fits today --
              not the perfect version of your week that never shows up.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/mobile/waitlist"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-7 py-4 text-base font-semibold btn-glow transition-all duration-200 hover:-translate-y-px"
                style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
              >
                Get Early Access
              </Link>
              <Link
                href="/mobile/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)] px-7 py-4 text-base font-medium transition-all duration-200 hover:-translate-y-px"
                style={{
                  border: "1px solid var(--border-hover)",
                  color: "var(--text-secondary)",
                }}
              >
                See How It Works
              </Link>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              variants={itemVariants}
              aria-hidden="true"
              className="flex flex-col items-start gap-2 opacity-30"
            >
              <span
                className="text-[10px] uppercase"
                style={{ letterSpacing: "0.2em", color: "var(--text-tertiary)" }}
              >
                Scroll
              </span>
              <div
                className="h-8 w-px animate-float"
                style={{
                  background: "linear-gradient(to bottom, var(--text-tertiary), transparent)",
                  animationDelay: "1s",
                }}
              />
            </motion.div>
          </div>

          {/* Right: phone mockup */}
          <motion.div
            variants={itemVariants}
            className="flex justify-center md:justify-end"
          >
            <PhoneFrame tiltDeg={0} floatDelay="0s">
              <TodayScreen />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
