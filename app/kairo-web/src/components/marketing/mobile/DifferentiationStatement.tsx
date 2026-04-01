"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

const HEADLINE_PARTS = [
  { text: "Unlike rigid 12-week programs", highlight: false },
  { text: "that break when you miss a day,", highlight: false },
  { text: "Kairo", highlight: false },
  { text: "adapts your plan daily.", highlight: true },
];

const SUBLINE = "Because consistency beats perfection.";

const sentence: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const word: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

/**
 * Cinematic word-reveal statement section.
 * Headline splits into individual words, each slides up with a stagger.
 * Respects prefers-reduced-motion -- skips animation if user prefers.
 */
export default function DifferentiationStatement() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const prefersReduced = useReducedMotion();

  return (
    <section
      className="relative py-28 md:py-40 px-5 md:px-10 overflow-hidden"
      style={{ background: "var(--bg-secondary)" }}
    >
      {/* Subtle grain texture overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-4xl text-center">
        <p
          className="text-xs font-medium uppercase tracking-[0.12em] mb-10"
          style={{ color: "var(--accent-primary)" }}
        >
          Why Kairo
        </p>

        {/* Word-reveal headline */}
        <motion.div
          variants={sentence}
          initial="hidden"
          animate={prefersReduced ? "visible" : (inView ? "visible" : "hidden")}
          style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 0.35em", lineHeight: 1.15 }}
        >
          {HEADLINE_PARTS.map((part, partIdx) =>
            part.text.split(" ").map((w, wIdx) => (
              <motion.span
                key={`${partIdx}-${wIdx}`}
                variants={word}
                className="font-display font-black inline-block"
                style={{
                  fontSize: "clamp(2rem, 5.5vw, 3.75rem)",
                  letterSpacing: "-0.03em",
                  color: part.highlight ? "var(--accent-primary)" : "var(--text-primary)",
                }}
              >
                {w}
              </motion.span>
            ))
          )}
        </motion.div>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, delay: 0.8, ease: "easeOut" }}
          className="mt-8 text-lg md:text-xl"
          style={{ color: "var(--text-secondary)", fontStyle: "italic" }}
        >
          {SUBLINE}
        </motion.p>
      </div>
    </section>
  );
}
