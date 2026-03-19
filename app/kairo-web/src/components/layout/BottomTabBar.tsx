"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface TabItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

interface BottomTabBarProps {
  tabs: TabItem[];
}

export default function BottomTabBar({ tabs }: BottomTabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "calc(56px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "var(--bg-secondary)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 100,
      }}
    >
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
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
              textDecoration: "none",
              position: "relative",
              color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
              minHeight: "44px",
              paddingTop: "8px",
            }}
          >
            {/* Active dot indicator above icon */}
            {active && (
              <motion.div
                layoutId="tab-dot"
                style={{
                  position: "absolute",
                  top: 4,
                  width: 4,
                  height: 4,
                  borderRadius: "9999px",
                  background: "var(--accent-primary)",
                  boxShadow: "0 0 6px var(--accent-primary)",
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            </motion.div>
            <span style={{ fontSize: "0.6875rem", fontWeight: active ? 600 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
