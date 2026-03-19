type TierVariant = "foundation" | "coaching" | "performance" | "vip";
type StatusVariant = "active" | "canceled" | "past_due" | "pending";

interface TierBadgeProps {
  variant: "tier";
  value: TierVariant;
}
interface StatusBadgeProps {
  variant: "status";
  value: StatusVariant;
}
type BadgeProps = (TierBadgeProps | StatusBadgeProps) & { className?: string };

const TIER_STYLES: Record<TierVariant, { label: string; bg: string; color: string }> = {
  foundation: { label: "Foundation", bg: "rgba(160,160,160,0.12)", color: "var(--text-secondary)" },
  coaching:   { label: "Coaching",   bg: "rgba(224,255,79,0.12)",  color: "var(--accent-primary)" },
  performance:{ label: "Performance",bg: "rgba(79,255,224,0.12)",  color: "var(--accent-secondary)" },
  vip:        { label: "VIP Elite",  bg: "rgba(224,255,79,0.08)",  color: "var(--accent-primary)" },
};

const STATUS_STYLES: Record<StatusVariant, { label: string; bg: string; color: string }> = {
  active:   { label: "Active",   bg: "rgba(74,222,128,0.12)",  color: "var(--status-success)" },
  canceled: { label: "Cancelled",bg: "rgba(248,113,113,0.12)", color: "var(--status-error)"   },
  past_due: { label: "Past Due", bg: "rgba(251,191,36,0.12)",  color: "var(--status-warning)"  },
  pending:  { label: "Pending",  bg: "rgba(160,160,160,0.12)", color: "var(--text-tertiary)"   },
};

export default function Badge({ variant, value, className = "" }: BadgeProps) {
  const style = variant === "tier"
    ? TIER_STYLES[value as TierVariant]
    : STATUS_STYLES[value as StatusVariant];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        lineHeight: 1.5,
        background: style.bg,
        color: style.color,
        letterSpacing: "0.01em",
      }}
    >
      {style.label}
    </span>
  );
}
