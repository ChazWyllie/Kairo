"use client";

const ITEMS = [
  "Trusted by early testers in 12+ countries",
  "Built for real schedules, not ideal ones",
  "Adapting plans daily since 2025",
  "30-second daily logging",
  "Travel mode built in",
  "No rigid 12-week programs",
  "Consistency beats perfection",
  "Auto-adjusts when life happens",
];

export default function SocialProofBar() {
  return (
    <div
      className="overflow-hidden py-4"
      style={{
        borderTop: "1px solid var(--border-subtle)",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-secondary)",
      }}
    >
      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "marquee 30s linear infinite",
          willChange: "transform",
        }}
        onMouseEnter={(e) =>
          ((e.currentTarget as HTMLElement).style.animationPlayState = "paused")
        }
        onMouseLeave={(e) =>
          ((e.currentTarget as HTMLElement).style.animationPlayState = "running")
        }
      >
        {/* Copy 1 */}
        <div style={{ display: "flex", gap: "0", whiteSpace: "nowrap" }}>
          {ITEMS.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-3"
              style={{ padding: "0 32px", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <span style={{ color: "var(--accent-primary)", fontSize: "6px" }}>&#9679;</span>
              {item}
            </span>
          ))}
        </div>
        {/* Copy 2 -- makes the loop seamless */}
        <div style={{ display: "flex", gap: "0", whiteSpace: "nowrap" }} aria-hidden="true">
          {ITEMS.map((item) => (
            <span
              key={`${item}-2`}
              className="inline-flex items-center gap-3"
              style={{ padding: "0 32px", color: "var(--text-tertiary)", fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              <span style={{ color: "var(--accent-primary)", fontSize: "6px" }}>&#9679;</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
