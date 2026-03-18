"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type CSSProperties,
  type ElementType,
} from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before the reveal transition starts — used for stagger effects */
  delay?: number;
  /** HTML element to render as wrapper. Defaults to "div". */
  as?: ElementType;
  style?: CSSProperties;
  role?: string;
}

/**
 * Wraps children in a container that reveals (fades up) when scrolled into view.
 *
 * Uses IntersectionObserver to add the `revealed` CSS class defined in globals.css.
 * Fire-once — unobserves after first intersection so it doesn't re-hide on scroll-up.
 * Respects `prefers-reduced-motion` via the CSS rule in globals.css.
 */
export default function ScrollReveal({
  children,
  className,
  delay,
  as: Tag = "div",
  style,
  role,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay) {
              (entry.target as HTMLElement).style.transitionDelay = `${delay}ms`;
            }
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      {
        threshold: 0.15,
        // Negative bottom margin means element must be 50px above the viewport
        // bottom before triggering — prevents premature fires on mobile
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <Tag
      ref={ref}
      data-reveal
      className={className}
      style={style}
      role={role}
    >
      {children}
    </Tag>
  );
}
