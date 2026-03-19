"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";

interface BundleCardProps {
  name: string;
  price: number;
  originalPrice: number;
  savings: number;
  description: string;
  benefits: readonly string[];
  stripePriceId: string | undefined;
  comingSoon?: boolean;
}

/**
 * Bundle product card — visually differentiated from individual ProductCards.
 * Features a gradient border (lime to cyan) and a "Best Value" badge.
 */
export default function BundleCard({
  name,
  price,
  originalPrice,
  savings,
  description,
  benefits,
  stripePriceId,
  comingSoon = true,
}: BundleCardProps) {
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
        console.error("[BundleCard] Checkout error:", data.error?.message);
      }
    } catch {
      console.error("[BundleCard] Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: "var(--radius-lg)",
        padding: "1px",
        background: comingSoon
          ? "var(--border-subtle)"
          : "linear-gradient(135deg, #E0FF4F 0%, #4FFFE0 100%)",
        opacity: comingSoon ? 0.72 : 1,
        transition: "opacity 0.2s ease",
      }}
    >
      {/* "Best Value" badge */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-10px",
          right: "12px",
          background: "linear-gradient(135deg, #E0FF4F 0%, #4FFFE0 100%)",
          color: "#0A0A0A",
          borderRadius: "var(--radius-full)",
          padding: "3px 10px",
          fontSize: "0.6875rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          zIndex: 1,
        }}
      >
        Best Value
      </div>

      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "calc(var(--radius-lg) - 1px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        {/* Guide preview placeholder — PLACEHOLDER: replace with real bundle mockup */}
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
          <BookOpen size={28} style={{ color: "var(--accent-primary)", opacity: 0.6 }} />
          <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Bundle Preview
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
              background: "linear-gradient(135deg, rgba(224,255,79,0.15) 0%, rgba(79,255,224,0.15) 100%)",
              color: "var(--accent-primary)",
              border: "1px solid rgba(224,255,79,0.2)",
              width: "fit-content",
            }}
          >
            Complete Bundle
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

          {/* Savings callout */}
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--accent-primary)" }}>
            Save ${savings} when you bundle
          </p>

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
    </div>
  );
}
