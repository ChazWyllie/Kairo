"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomTabBar, { type TabItem } from "./BottomTabBar";
import Sidebar from "./Sidebar";

interface DashboardShellProps {
  tabs: TabItem[];
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function DashboardShell({ tabs, children }: DashboardShellProps) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar tabs={tabs} />
      </div>

      {/* Mobile bottom tab bar — hidden on desktop */}
      <div className="md:hidden">
        <BottomTabBar tabs={tabs} />
      </div>

      {/* Main content area */}
      <main
        style={{
          // Desktop: offset by sidebar width (240px default)
          // Mobile: full width, padded bottom for tab bar
        }}
        className="
          md:pl-60
          pb-[calc(56px+env(safe-area-inset-bottom))]
          md:pb-0
        "
      >
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            padding: "24px 16px",
          }}
          className="md:px-8 md:py-8"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
