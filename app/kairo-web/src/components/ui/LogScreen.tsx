"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DURATIONS = [4500, 3000];

const CHECKLIST_ITEMS = [
  "Workout completed",
  "Meal 1 -- Breakfast",
  "Meal 2 -- Lunch",
  "Meal 3 -- Dinner",
  "Water target (3.0L)",
  "Steps (8,000+)",
];

function ActiveLoggingView() {
  // Auto-check items sequentially, then reset
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    if (checkedCount >= CHECKLIST_ITEMS.length) {
      // Brief pause then reset
      const reset = setTimeout(() => setCheckedCount(0), 1200);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(
      () => setCheckedCount((c) => c + 1),
      checkedCount === 0 ? 400 : 600
    );
    return () => clearTimeout(timer);
  }, [checkedCount]);

  const progress = Math.round((checkedCount / CHECKLIST_ITEMS.length) * 100);

  return (
    <div style={{ padding: "12px 10px", display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "9px", fontWeight: 700, color: "#f5f5f5" }}>Quick Log</div>
        <div style={{ fontSize: "7px", color: "#666" }}>30 seconds</div>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span style={{ fontSize: "7px", color: "#666" }}>Progress</span>
          <span style={{ fontSize: "7px", fontWeight: 600, color: "var(--accent-primary)" }}>{progress}%</span>
        </div>
        <div style={{ height: "3px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
          <motion.div
            style={{
              height: "100%",
              background: "var(--accent-primary)",
              borderRadius: "2px",
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {CHECKLIST_ITEMS.map((item, i) => {
          const isChecked = i < checkedCount;
          return (
            <motion.div
              key={item}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "5px 7px",
                borderRadius: "6px",
                background: isChecked ? "rgba(224,255,79,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${isChecked ? "rgba(224,255,79,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
              animate={{ opacity: isChecked ? 1 : 0.5 }}
              transition={{ duration: 0.3 }}
            >
              {/* Checkbox */}
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                border: `1.5px solid ${isChecked ? "var(--accent-primary)" : "#444"}`,
                background: isChecked ? "var(--accent-primary)" : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {isChecked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ width: "5px", height: "5px", background: "#0a0a0a", borderRadius: "1px" }}
                  />
                )}
              </div>
              <span style={{
                fontSize: "7.5px",
                color: isChecked ? "#f5f5f5" : "#666",
                textDecoration: isChecked ? "line-through" : "none",
                textDecorationColor: "#444",
              }}>
                {item}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MissedView() {
  return (
    <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", textAlign: "center", height: "100%", justifyContent: "center" }}>
      {/* Icon */}
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
      }} />

      <div>
        <div style={{ fontSize: "10px", fontWeight: 700, color: "#f5f5f5", marginBottom: "4px" }}>Missed today?</div>
        <div style={{ fontSize: "8px", fontWeight: 600, color: "var(--accent-primary)", marginBottom: "6px" }}>No guilt. No reset.</div>
        <div style={{ fontSize: "7.5px", color: "#888", lineHeight: 1.5 }}>
          Tap below and tomorrow&apos;s plan automatically adjusts to keep you on track.
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        <button style={{
          width: "100%",
          background: "transparent",
          border: "1.5px solid rgba(239,68,68,0.5)",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "8px",
          fontWeight: 600,
          color: "#ef4444",
          cursor: "default",
        }}>
          I missed
        </button>
        <button style={{
          width: "100%",
          background: "var(--accent-primary)",
          border: "none",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "8px",
          fontWeight: 700,
          color: "#0a0a0a",
          cursor: "default",
        }}>
          I&apos;m still going
        </button>
      </div>
    </div>
  );
}

/**
 * Log screen -- loops through 2 states.
 * State 0: Active logging with sequential auto-check animation
 * State 1: "I Missed" flow
 */
export default function LogScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setIndex((i) => (i + 1) % 2),
      DURATIONS[index]
    );
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div style={{ height: "100%", background: "#0a0a0a", overflow: "hidden" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{ height: "100%" }}
        >
          {index === 0 && <ActiveLoggingView />}
          {index === 1 && <MissedView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
