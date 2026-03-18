"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";

const FAQS = [
  {
    question: "How is this different from a generic workout app?",
    answer:
      "Apps give you a static program and hope you fit your life around it. Kairo does the opposite, it adapts to your actual day. Busy week with no gym access? Short on sleep? Your plan changes. A coach reviews your progress and adjusts the structure, not just the reps.",
  },
  {
    question: "What if I miss a day?",
    answer:
      "Nothing breaks. Log what happened (or didn't), and tomorrow's plan adjusts accordingly. Missing days is part of real life, Kairo is designed around that, not against it. Consistency over long periods matters more than perfection on any given week.",
  },
  {
    question: "Do I need a gym membership?",
    answer:
      "No. During onboarding you tell us what equipment you have access to, gym, home setup, just bodyweight, or hotel room. Your plan is built around whatever you actually have. You can change this any time.",
  },
  {
    question: "What does the nutrition coaching include?",
    answer:
      "Daily protein targets calibrated to your goal and body, practical meal timing guidance, and adjustments based on your check-in data. This is not a meal plan or calorie counting, it's actionable direction that actually fits how people eat.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, no questions asked. There are no contracts, no minimum commitment, and no cancellation fees. You can cancel directly from your account at any time. The founding member pricing is locked in for as long as you remain subscribed.",
  },
  {
    question: "Is this medical advice?",
    answer:
      "No. Kairo provides fitness coaching and general nutrition guidance for healthy adults. It is not a substitute for medical advice, diagnosis, or treatment. If you have a medical condition, injury, or health concern, consult a qualified healthcare professional before starting any fitness program.",
  },
] as const;

/**
 * FAQ accordion section.
 * Uses CSS max-height transition (not height: auto, which can't animate).
 * Only one item open at a time — clicking the open item closes it.
 */
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section
      id="faq"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-tertiary)" }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Section heading */}
        <ScrollReveal className="mb-14">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            Common questions
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Questions?
            <br />
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
              Answered.
            </span>
          </h2>
        </ScrollReveal>

        {/* Accordion */}
        <div role="list">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;

            return (
              <ScrollReveal
                key={faq.question}
                delay={i * 60}
                as="div"
                role="listitem"
                style={{
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors duration-150"
                  style={{ color: isOpen ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  <span className="text-base font-medium">{faq.question}</span>
                  {/* +/× icon that rotates 45deg */}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl font-light transition-transform duration-300"
                    style={{
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      color: isOpen ? "var(--accent-primary)" : "var(--text-tertiary)",
                    }}
                  >
                    +
                  </span>
                </button>

                {/*
                  max-height transition — must use a fixed px value (not auto).
                  500px is a safe upper bound for any FAQ answer length.
                */}
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: isOpen ? "500px" : "0px",
                    transition: "max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  <p
                    className="pb-6 text-base leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {faq.answer}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
