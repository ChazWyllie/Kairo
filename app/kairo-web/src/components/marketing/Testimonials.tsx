import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  LANDING_SECTIONS,
  type SocialProofSection,
  type Testimonial,
} from "@/lib/landing-config";

const section = LANDING_SECTIONS.find(
  (s) => s.id === "social-proof"
) as SocialProofSection;

// PLACEHOLDER -- replace metrics with real data when available
const METRICS: Record<string, string> = {
  "Jordan M.": "12-day streak",
  "Priya S.":  "8 lbs in 6 weeks",
  "Marcus T.": "3 months consistent",
};

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const metric = METRICS[testimonial.name];

  return (
    <article
      className="snap-start shrink-0 w-[85vw] md:w-auto flex flex-col gap-5 rounded-[var(--radius-lg)] p-6 border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Opening quote mark */}
      <span
        className="font-display font-black text-5xl leading-none select-none"
        style={{ color: "var(--accent-primary)", opacity: 0.5 }}
        aria-hidden="true"
      >
        &ldquo;
      </span>

      <blockquote
        className="text-base sm:text-lg leading-relaxed flex-1"
        style={{ color: "var(--text-secondary)" }}
      >
        {testimonial.text}
      </blockquote>

      <footer className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {testimonial.name}
          </p>
          {testimonial.role && (
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {testimonial.role}
            </p>
          )}
        </div>

        {/* PLACEHOLDER -- replace with real metric */}
        {metric && (
          <span
            className="rounded-full px-3 py-1 text-xs font-medium shrink-0"
            style={{
              background: "rgba(224,255,79,0.08)",
              color: "var(--accent-primary)",
              border: "1px solid rgba(224,255,79,0.15)",
            }}
          >
            {metric}
          </span>
        )}
      </footer>
    </article>
  );
}

/**
 * Testimonials section.
 * Mobile: horizontal scroll with CSS snap (no JS carousel).
 * Desktop: 2-column grid.
 * Server component -- no state or effects.
 */
export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <ScrollReveal className="mb-14">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            {/* PLACEHOLDER -- replace with real testimonial count */}
            Client stories
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Real people.
            <br />
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
              Real consistency.
            </span>
          </h2>
        </ScrollReveal>

        <div
          className="
            flex gap-5 overflow-x-auto pb-4
            md:grid md:grid-cols-2 md:overflow-visible md:pb-0
          "
          style={{
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {section.testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 120}>
              <TestimonialCard testimonial={t} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="mt-16">
          <p
            className="text-center text-xs uppercase tracking-[0.12em]"
            style={{ color: "var(--text-tertiary)" }}
          >
            Trusted by professionals in tech, finance &amp; healthcare
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
