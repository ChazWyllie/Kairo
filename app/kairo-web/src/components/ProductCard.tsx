"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

interface ProductCardProps {
  name: string;
  price: number;
  originalPrice: number;
  category: string;
  description: string;
  benefits: readonly string[];
  stripePriceId: string | undefined;
  comingSoon?: boolean;
}

/**
 * Individual template product card.
 * In "Coming Soon" state: cards are visible at reduced opacity, buttons disabled.
 * When templates launch: set comingSoon=false to enable purchase flow.
 */
export default function ProductCard({
  name,
  price,
  originalPrice,
  category,
  description,
  benefits,
  stripePriceId,
  comingSoon = true,
}: ProductCardProps) {
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    if (!stripePriceId || comingSoon) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: stripePriceId }),
      });
      const data = await res.json() as { url?: string; error?: { message: string } };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("[ProductCard] Checkout error:", data.error?.message);
      }
    } catch {
      console.error("[ProductCard] Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        opacity: comingSoon ? 0.72 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* Guide preview placeholder — PLACEHOLDER: replace with real product mockup */}
      <div
        style={{
          background: "var(--bg-tertiary)",
          aspectRatio: "3 / 4",
          maxHeight: "180px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
        aria-hidden="true"
      >
        <BookOpen size={28} style={{ color: "var(--text-tertiary)", opacity: 0.5 }} />
        <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Guide Preview
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {/* Category badge */}
        <span
          style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: "rgba(224,255,79,0.1)",
            color: "var(--accent-primary)",
            border: "1px solid rgba(224,255,79,0.15)",
            width: "fit-content",
          }}
        >
          {category}
        </span>

        {/* Title + description */}
        <div>
          <h3
            className="font-display font-bold"
            style={{ fontSize: "1.0625rem", color: "var(--text-primary)", marginBottom: "4px", letterSpacing: "-0.01em" }}
          >
            {name}
          </h3>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {description}
          </p>
        </div>

        {/* Price block */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          <span
            style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            ${price}
          </span>
          <span
            style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", textDecoration: "line-through" }}
          >
            ${originalPrice}
          </span>
          <span
            style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#FBBF24", textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            Founding Price
          </span>
        </div>

        {/* Benefits */}
        <ul style={{ display: "flex", flexDirection: "column", gap: "6px", listStyle: "none", padding: 0, margin: 0 }}>
          {benefits.map((benefit) => (
            <li key={benefit} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              <span style={{ color: "var(--accent-primary)", flexShrink: 0, fontSize: "0.875rem" }}>✓</span>
              {benefit}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          type="button"
          onClick={handleBuy}
          disabled={comingSoon || loading}
          style={{
            marginTop: "auto",
            width: "100%",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
            cursor: comingSoon ? "not-allowed" : "pointer",
            background: comingSoon ? "var(--bg-tertiary)" : "var(--accent-primary)",
            color: comingSoon ? "var(--text-tertiary)" : "var(--bg-primary)",
            transition: "opacity 0.15s ease",
          }}
        >
          {loading ? "Redirecting..." : comingSoon ? "Coming Soon" : `Buy Now $${price}`}
        </button>
      </div>
    </div>
  );
}
