import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { COACHING_TIERS } from "@/lib/products";

/**
 * Two-tier coaching pricing section.
 * Application-based (links to /apply).
 */
export default function CoachingSection() {
  const tiers = [COACHING_TIERS.standard, COACHING_TIERS.premium] as const;

  return (
    <section
      id="coaching"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-secondary)" }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Section heading */}
        <ScrollReveal className="mb-14 text-center">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-primary)" }}
          >
            1-on-1 coaching
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Ready for personalized coaching?
          </h2>
          <p
            className="mt-4 mx-auto max-w-md text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Templates get you started. Coaching gets you there. Two plans, zero fluff.
          </p>
        </ScrollReveal>

        {/* Two-card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier, i) => {
            const isHighlighted = tier.highlighted;

            return (
              <ScrollReveal key={tier.name} delay={i * 100}>
                <div
                  style={
                    isHighlighted
                      ? {
                          padding: "1px",
                          borderRadius: "var(--radius-lg)",
                          background: "linear-gradient(135deg, rgba(224,255,79,0.5) 0%, rgba(79,255,224,0.3) 100%)",
                        }
                      : undefined
                  }
                >
                  <div
                    style={{
                      background: "var(--bg-primary)",
                      borderRadius: isHighlighted ? "calc(var(--radius-lg) - 1px)" : "var(--radius-lg)",
                      border: isHighlighted ? "none" : "1px solid var(--border-subtle)",
                      padding: "28px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                      height: "100%",
                    }}
                  >
                    {/* Badge row */}
                    <div style={{ minHeight: "24px" }}>
                      {tier.badge && (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "3px 10px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(224,255,79,0.12)",
                            color: "var(--accent-primary)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            border: "1px solid rgba(224,255,79,0.2)",
                          }}
                        >
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    {/* Title + tagline */}
                    <div>
                      <h3
                        className="font-display font-black"
                        style={{ fontSize: "1.5rem", color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "6px" }}
                      >
                        {tier.name}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.55 }}>
                        {tier.tagline}
                      </p>
                    </div>

                    {/* Price block */}
                    <div>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                        <span
                          style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.03em", lineHeight: 1 }}
                        >
                          ${tier.price}
                          <span style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-tertiary)" }}>/mo</span>
                        </span>
                        <span style={{ fontSize: "0.9375rem", color: "var(--text-tertiary)", textDecoration: "line-through" }}>
                          ${tier.originalPrice}/mo
                        </span>
                      </div>
                      <p style={{ fontSize: "0.75rem", color: "#FBBF24", marginTop: "4px", fontWeight: 600 }}>
                        Founding member pricing
                      </p>
                    </div>

                    {/* Features */}
                    <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
                      {tier.features.map((feature) => (
                        <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "18px",
                              height: "18px",
                              borderRadius: "50%",
                              background: "rgba(224,255,79,0.12)",
                              color: "var(--accent-primary)",
                              fontSize: "0.7rem",
                              flexShrink: 0,
                              marginTop: "1px",
                            }}
                            aria-hidden="true"
                          >
                            ✓
                          </span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href="/apply"
                      className={`block w-full text-center rounded-[var(--radius-sm)] py-3.5 text-base font-semibold transition-all duration-200 hover:-translate-y-px${isHighlighted ? " btn-glow" : ""}`}
                      style={
                        isHighlighted
                          ? { background: "var(--accent-primary)", color: "var(--bg-primary)" }
                          : { background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-hover)" }
                      }
                    >
                      Apply for {tier.name}
                    </Link>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Footnote */}
        <ScrollReveal delay={200}>
          <p
            className="mt-8 text-center text-sm"
            style={{ color: "var(--text-tertiary)" }}
          >
            All coaching includes a 7-day satisfaction guarantee. Upgrade or cancel anytime.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
