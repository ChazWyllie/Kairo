"use client";

import { motion, useInView, type Variants } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    number: "01",
    title: "Set your constraints",
    description:
      "How much time do you have? 15, 30, 45 minutes? Traveling? Stressed? Low sleep? Toggle it on.",
    badge: "Takes 10 seconds",
  },
  {
    number: "02",
    title: "Get today's plan",
    description:
      "Receive 2 to 3 workout options that fit your constraints, plus a protein target and meal suggestions.",
    badge: "Personalized daily",
  },
  {
    number: "03",
    title: "Log in 30 seconds",
    description:
      "Check off workout, meals, water, steps. Missed something? Tap \"I missed\" -- no guilt, no reset. Tomorrow adjusts.",
    badge: "Auto-adapts",
  },
] as const;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      delay: i * 0.1,
    },
  }),
};

/**
 * How It Works section for the mobile app landing.
 * Three step cards with staggered Framer entrance on scroll.
 * No tab toggle -- this is the app-specific 3-step flow.
 */
export default function MobileHowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-14 text-center"
        >
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            The process
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Three steps.
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}> Zero friction.</span>
          </h2>
        </motion.div>

        {/* Step cards */}
        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              style={{
                position: "relative",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "28px",
                overflow: "hidden",
              }}
            >
              {/* Large faint step number */}
              <span
                className="font-display font-black select-none"
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "16px",
                  fontSize: "7rem",
                  color: "var(--accent-primary)",
                  opacity: 0.06,
                  lineHeight: 1,
                  userSelect: "none",
                }}
                aria-hidden="true"
              >
                {step.number}
              </span>

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Badge */}
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    background: "rgba(224,255,79,0.1)",
                    color: "var(--accent-primary)",
                    border: "1px solid rgba(224,255,79,0.2)",
                    width: "fit-content",
                  }}
                >
                  {step.badge}
                </span>

                {/* Title */}
                <h3
                  className="font-display font-bold"
                  style={{
                    fontSize: "1.125rem",
                    color: "var(--text-primary)",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                  }}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
