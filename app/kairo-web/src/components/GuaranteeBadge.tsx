import { ShieldCheck } from "lucide-react";

/**
 * 30-day money-back guarantee badge.
 * Small inline element shown below the template product grid.
 */
export default function GuaranteeBadge() {
  return (
    <div
      className="flex items-center justify-center gap-2.5"
      style={{ color: "var(--text-tertiary)" }}
    >
      <ShieldCheck
        size={16}
        style={{ color: "var(--accent-primary)", flexShrink: 0 }}
        aria-hidden="true"
      />
      <p className="text-sm text-center">
        <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
          30-Day Money-Back Guarantee.
        </span>{" "}
        Not satisfied? Full refund, no questions asked.
      </p>
    </div>
  );
}
