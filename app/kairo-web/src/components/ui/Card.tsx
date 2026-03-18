import type { ReactNode, MouseEventHandler, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Adds a 2px lime left border accent */
  accentBorder?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export default function Card({ children, className = "", style, accentBorder, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-subtle)",
        borderLeft: accentBorder ? "2px solid var(--accent-primary)" : "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "16px",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
