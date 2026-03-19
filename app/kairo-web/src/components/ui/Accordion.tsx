"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function Accordion({ title, children, defaultOpen = false, className = "", style }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        overflow: "hidden",
        background: "var(--bg-secondary)",
        ...style,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-primary)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          textAlign: "left",
        }}
      >
        {title}
        <span
          style={{
            display: "inline-block",
            fontSize: "1.125rem",
            color: "var(--text-tertiary)",
            transform: open ? "rotate(45deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            flexShrink: 0,
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? "600px" : "0px",
          overflow: "hidden",
          transition: "max-height 0.35s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      >
        <div style={{ padding: "0 16px 16px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
