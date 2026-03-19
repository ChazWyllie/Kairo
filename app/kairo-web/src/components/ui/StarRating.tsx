"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div role="group" aria-label="Star rating" style={{ display: "flex", gap: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            aria-pressed={star <= value}
            style={{
              width: Math.max(size, 44),
              height: Math.max(size, 44),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: filled ? "var(--accent-primary)" : "var(--border-hover)",
              fontSize: size,
              lineHeight: 1,
              transition: "color 0.15s ease, transform 0.1s ease",
              transform: hovered === star ? "scale(1.15)" : "scale(1)",
            }}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
