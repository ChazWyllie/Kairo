"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import type { TabItem } from "./BottomTabBar";

interface SidebarProps {
  tabs: TabItem[];
}

export default function Sidebar({ tabs }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const width = collapsed ? 56 : 240;

  return (
    <motion.aside
      animate={{ width }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        overflow: "hidden",
      }}
      aria-label="Sidebar navigation"
    >
      {/* Logo */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 16px" : "0 20px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "1rem",
              letterSpacing: "0.15em",
              color: "var(--text-primary)",
              textTransform: "uppercase",
            }}
          >
            Kairo
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {tabs.map((tab) => {
          const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                borderRadius: "8px",
                textDecoration: "none",
                background: active ? "var(--bg-tertiary)" : "transparent",
                borderLeft: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
                color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
                transition: "background 0.15s ease, color 0.15s ease",
                minHeight: "44px",
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.75} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <span style={{ fontSize: "0.875rem", fontWeight: active ? 600 : 400 }}>
                  {tab.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border-subtle)", flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: "10px",
            padding: "10px",
            borderRadius: "8px",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--text-tertiary)",
            minHeight: "44px",
          }}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          {!collapsed && <span style={{ fontSize: "0.875rem" }}>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}
