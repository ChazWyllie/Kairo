"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PhoneBottomNav from "./PhoneBottomNav";

const DURATIONS = [6000, 3500];

const CHECKLIST_ITEMS = [
  { text: "Workout completed", meta: "Push Day" },
  { text: "Meal 1 - Breakfast", meta: "42g protein" },
  { text: "Meal 2 - Lunch", meta: "55g protein" },
  { text: "Meal 3 - Dinner", meta: "48g protein" },
  { text: "Water target (3.0L)", meta: "Hydration" },
  { text: "Steps (8,000+)", meta: "6,420 so far" },
];

const CIRCUMFERENCE = 2 * Math.PI * 26; // r=26 on 62x62 svg

function Checkmark() {
  return (
    <svg
      width="9"
      height="7"
      viewBox="0 0 9 7"
      fill="none"
      style={{ position: "absolute", inset: 0, margin: "auto" }}
    >
      <path
        d="M1.5 3.5L3.5 5.5L7.5 1.5"
        stroke="#0a0a0a"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActiveLoggingView() {
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    if (checkedCount >= CHECKLIST_ITEMS.length) {
      const reset = setTimeout(() => setCheckedCount(0), 1600);
      return () => clearTimeout(reset);
    }
    const timer = setTimeout(
      () => setCheckedCount((c) => c + 1),
      checkedCount === 0 ? 400 : 650
    );
    return () => clearTimeout(timer);
  }, [checkedCount]);

  const progress = checkedCount / CHECKLIST_ITEMS.length;
  const dashOffset = CIRCUMFERENCE * (1 - progress);
  const isComplete = checkedCount === CHECKLIST_ITEMS.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: "14px", fontWeight: 800, color: "#f5f5f5" }}>Quick Log</div>
        <div style={{ fontSize: "7.5px", color: "#555", marginTop: "2px" }}>
          30 seconds - confirm or tap to adjust
        </div>
      </div>

      {/* SVG ring */}
      <div style={{ display: "flex", justifyContent: "center", margin: "2px 0" }}>
        <svg
          width="62"
          height="62"
          style={{
            filter: isComplete ? "drop-shadow(0 0 6px var(--accent-primary))" : "none",
            transition: "filter 0.4s",
          }}
        >
          {/* Track */}
          <circle
            cx="31" cy="31" r="26"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="5"
          />
          {/* Fill */}
          <motion.circle
            cx="31" cy="31" r="26"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "31px 31px" }}
          />
          {/* Center text */}
          <text
            x="31" y="27"
            textAnchor="middle"
            fill={isComplete ? "var(--accent-primary)" : "#f5f5f5"}
            fontSize="13"
            fontWeight="800"
          >
            {isComplete ? "Done" : `${checkedCount}/${CHECKLIST_ITEMS.length}`}
          </text>
          <text x="31" y="40" textAnchor="middle" fill="#555" fontSize="8">
            {isComplete ? "" : "done"}
          </text>
        </svg>
      </div>

      {/* Checklist */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {CHECKLIST_ITEMS.map((item, i) => {
          const isChecked = i < checkedCount;
          return (
            <motion.div
              key={item.text}
              animate={{ opacity: isChecked ? 1 : 0.55 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "7px",
                padding: "6px 8px",
                borderRadius: "0 9px 9px 0",
                background: isChecked ? "rgba(224,255,79,0.05)" : "#111",
                border: `1px solid ${isChecked ? "rgba(224,255,79,0.15)" : "rgba(255,255,255,0.07)"}`,
                borderLeft: isChecked ? "2px solid var(--accent-primary)" : "2px solid transparent",
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                border: `1.5px solid ${isChecked ? "var(--accent-primary)" : "#333"}`,
                background: isChecked ? "var(--accent-primary)" : "transparent",
                flexShrink: 0,
                position: "relative",
              }}>
                {isChecked && <Checkmark />}
              </div>
              {/* Text */}
              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: "8.5px",
                  color: isChecked ? "#f5f5f5" : "#555",
                  textDecoration: isChecked ? "line-through" : "none",
                  textDecorationColor: "#333",
                }}>
                  {item.text}
                </span>
              </div>
              {/* Meta */}
              <span style={{ fontSize: "7px", color: "#444", flexShrink: 0 }}>
                {item.meta}
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
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      alignItems: "center",
      textAlign: "center",
      padding: "8px 4px",
    }}>
      {/* Streak protection card */}
      <div style={{
        background: "#111",
        border: "1px solid rgba(224,255,79,0.2)",
        borderRadius: "12px",
        padding: "12px 20px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--accent-primary)", lineHeight: 1 }}>12</div>
        <div style={{ fontSize: "7px", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "3px" }}>
          day streak
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", fontWeight: 700, color: "#f5f5f5", marginBottom: "4px" }}>
          {"Don't break it."}
        </div>
        <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--accent-primary)", marginBottom: "6px" }}>
          No guilt. No reset.
        </div>
        <div style={{ fontSize: "9px", color: "#888", lineHeight: 1.5 }}>
          {"Tomorrow's plan adjusts automatically. Just tap below."}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
        <button style={{
          width: "100%",
          background: "transparent",
          border: "1.5px solid rgba(239,68,68,0.5)",
          borderRadius: "9px",
          padding: "9px",
          fontSize: "9px",
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
          borderRadius: "9px",
          padding: "9px",
          fontSize: "9px",
          fontWeight: 800,
          color: "#0a0a0a",
          cursor: "default",
        }}>
          {"I'm still going"}
        </button>
      </div>
    </div>
  );
}

/**
 * Log screen -- loops through 2 states.
 * State 0: Active logging with SVG ring and checklist + meta text
 * State 1: Missed day with streak protection card
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
    <div style={{ height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ padding: "12px" }}
          >
            {index === 0 && <ActiveLoggingView />}
            {index === 1 && <MissedView />}
          </motion.div>
        </AnimatePresence>
      </div>
      <PhoneBottomNav active="log" />
    </div>
  );
}
