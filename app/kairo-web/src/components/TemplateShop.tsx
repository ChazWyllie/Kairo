"use client";

import { useState } from "react";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ProductCard from "@/components/ProductCard";
import BundleCard from "@/components/BundleCard";
import GuaranteeBadge from "@/components/GuaranteeBadge";
import { TEMPLATE_PRODUCTS } from "@/lib/products";

/**
 * Template shop section — "Coming Soon" state.
 * Cards are visible but disabled. To launch: set COMING_SOON = false and
 * ensure STRIPE_TEMPLATE_*_PRICE_ID env vars are set.
 *
 * TODO: When templates are ready, flip COMING_SOON to false.
 */
const COMING_SOON = true;

export default function TemplateShop() {
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyStatus, setNotifyStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotifyStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notifyEmail }),
      });
      setNotifyStatus(res.ok ? "done" : "error");
    } catch {
      setNotifyStatus("error");
    }
  }

  return (
    <section
      id="templates"
      className="py-24 md:py-32 px-5 md:px-10"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Section heading */}
        <ScrollReveal className="mb-12">
          <p
            className="text-xs font-medium uppercase tracking-[0.12em] mb-4"
            style={{ color: "var(--accent-secondary)" }}
          >
            Training and nutrition guides
          </p>
          <h2
            className="font-display font-black leading-none"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            Training and Nutrition Guides
          </h2>
          <p
            className="mt-4 max-w-lg text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Evidence-based templates built for real results. Instant download after purchase. No account required.
          </p>
        </ScrollReveal>

        {/* Coming Soon banner */}
        {COMING_SOON && (
          <ScrollReveal className="mb-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 18px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--accent-secondary)",
                  color: "#0A0A0A",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                Coming Soon
              </span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Join the waitlist to get early access and founding pricing.
              </p>

              {/* Email capture */}
              {notifyStatus === "done" ? (
                <p className="text-sm" style={{ color: "var(--accent-primary)", fontWeight: 500 }}>
                  You're on the list. We'll be in touch.
                </p>
              ) : (
                <form
                  onSubmit={handleNotify}
                  className="flex flex-col sm:flex-row gap-2 w-full max-w-sm mt-1"
                >
                  <input
                    type="email"
                    required
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    placeholder="your@email.com"
                    style={{
                      flex: 1,
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-hover)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      color: "var(--text-primary)",
                      fontSize: "16px",
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={notifyStatus === "loading"}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: "var(--accent-secondary)",
                      color: "#0A0A0A",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    {notifyStatus === "loading" ? "..." : "Notify Me"}
                  </button>
                </form>
              )}
              {notifyStatus === "error" && (
                <p className="text-xs" style={{ color: "var(--status-error)" }}>
                  Something went wrong. Try again or email us directly.
                </p>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Product grid
            Mobile: single column with bundle first (best deal)
            Tablet: 2x2 grid
            Desktop: 4 across */}
        <div
          className="grid gap-5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {/* Bundle first on mobile via order */}
          <div className="md:order-last lg:order-none">
            <BundleCard
              name={TEMPLATE_PRODUCTS.bundle.name}
              price={TEMPLATE_PRODUCTS.bundle.price}
              originalPrice={TEMPLATE_PRODUCTS.bundle.originalPrice}
              savings={TEMPLATE_PRODUCTS.bundle.savings}
              description={TEMPLATE_PRODUCTS.bundle.description}
              benefits={TEMPLATE_PRODUCTS.bundle.benefits}
              stripePriceId={TEMPLATE_PRODUCTS.bundle.stripePriceId}
              comingSoon={COMING_SOON}
            />
          </div>
          <ProductCard
            name={TEMPLATE_PRODUCTS.workout.name}
            price={TEMPLATE_PRODUCTS.workout.price}
            originalPrice={TEMPLATE_PRODUCTS.workout.originalPrice}
            category={TEMPLATE_PRODUCTS.workout.category}
            description={TEMPLATE_PRODUCTS.workout.description}
            benefits={TEMPLATE_PRODUCTS.workout.benefits}
            stripePriceId={TEMPLATE_PRODUCTS.workout.stripePriceId}
            comingSoon={COMING_SOON}
          />
          <ProductCard
            name={TEMPLATE_PRODUCTS.nutrition.name}
            price={TEMPLATE_PRODUCTS.nutrition.price}
            originalPrice={TEMPLATE_PRODUCTS.nutrition.originalPrice}
            category={TEMPLATE_PRODUCTS.nutrition.category}
            description={TEMPLATE_PRODUCTS.nutrition.description}
            benefits={TEMPLATE_PRODUCTS.nutrition.benefits}
            stripePriceId={TEMPLATE_PRODUCTS.nutrition.stripePriceId}
            comingSoon={COMING_SOON}
          />
          <ProductCard
            name={TEMPLATE_PRODUCTS.supplements.name}
            price={TEMPLATE_PRODUCTS.supplements.price}
            originalPrice={TEMPLATE_PRODUCTS.supplements.originalPrice}
            category={TEMPLATE_PRODUCTS.supplements.category}
            description={TEMPLATE_PRODUCTS.supplements.description}
            benefits={TEMPLATE_PRODUCTS.supplements.benefits}
            stripePriceId={TEMPLATE_PRODUCTS.supplements.stripePriceId}
            comingSoon={COMING_SOON}
          />
        </div>

        {/* Guarantee + micro-testimonials */}
        <ScrollReveal className="mt-10 flex flex-col items-center gap-6">
          <GuaranteeBadge />

          {/* PLACEHOLDER: replace with real template buyer quotes */}
          <div className="flex flex-col sm:flex-row gap-6 text-center max-w-2xl">
            <blockquote className="flex-1">
              <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
                "The meal prep guide alone saved me 5 hours a week."
              </p>
              <footer className="mt-1 text-xs" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
                Sarah K. {/* PLACEHOLDER */}
              </footer>
            </blockquote>
            <blockquote className="flex-1">
              <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
                "Followed the strength program for 8 weeks. Hit a new deadlift PR."
              </p>
              <footer className="mt-1 text-xs" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
                James R. {/* PLACEHOLDER */}
              </footer>
            </blockquote>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
