interface SkeletonProps {
  variant?: "text" | "card" | "avatar" | "stat";
  className?: string;
  /** Width override (e.g. "60%", "120px") */
  width?: string;
  /** Height override */
  height?: string;
}

export default function Skeleton({ variant = "text", className = "", width, height }: SkeletonProps) {
  const base: React.CSSProperties = {
    background: "var(--bg-tertiary)",
    borderRadius:
      variant === "avatar" ? "9999px" :
      variant === "card"   ? "12px"   : "4px",
    width:  width  ?? (variant === "avatar" ? "40px"  : variant === "stat" ? "80px"  : "100%"),
    height: height ?? (variant === "avatar" ? "40px"  : variant === "card" ? "80px"  : variant === "stat" ? "32px" : "16px"),
    flexShrink: 0,
  };

  return (
    <div
      className={`animate-pulse ${className}`}
      style={base}
      aria-hidden="true"
    />
  );
}

/** Pre-composed skeleton for a full card row */
export function SkeletonCard() {
  return (
    <div
      className="animate-pulse"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
      aria-hidden="true"
    >
      <Skeleton variant="text" width="55%" />
      <Skeleton variant="text" width="80%" height="12px" />
      <Skeleton variant="text" width="40%" height="12px" />
    </div>
  );
}
