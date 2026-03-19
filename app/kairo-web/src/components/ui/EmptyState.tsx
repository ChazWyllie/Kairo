import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: "12px",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "16px",
          background: "var(--bg-tertiary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "4px",
        }}
      >
        <Icon size={24} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        {title}
      </p>
      <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", margin: 0, maxWidth: "280px", lineHeight: 1.6 }}>
        {description}
      </p>
      {action && <div style={{ marginTop: "8px" }}>{action}</div>}
    </div>
  );
}
