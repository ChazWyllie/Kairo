import type { CSSProperties } from "react";

/**
 * Returns an inline style object with a staggered transition-delay.
 * Used with [data-reveal] elements so each child reveals sequentially.
 *
 * @example
 * {steps.map((step, i) => (
 *   <ScrollReveal key={step.title} delay={i * 120}>
 *     ...
 *   </ScrollReveal>
 * ))}
 */
export function staggerDelay(index: number, baseMs = 100): CSSProperties {
  return { transitionDelay: `${index * baseMs}ms` };
}

/** The data attribute name used by the scroll-reveal CSS + IntersectionObserver system */
export const REVEAL_ATTR = "data-reveal" as const;
