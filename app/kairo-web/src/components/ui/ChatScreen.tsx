"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneBottomNav from "./PhoneBottomNav";

// Each scenario plays through 4 phases then advances to next scenario:
// phase 0 - coach opener
// phase 1 - user reply
// phase 2 - typing indicator
// phase 3 - coach response + card (hold)
const PHASE_DELAYS = [1000, 1300, 900, 5500];

interface CardRow { left: string; right: string }
interface Scenario {
  coachOpener: string;
  userMessage: string;
  coachResponse: string;
  cardTitle: string;
  cardRows: CardRow[];
  chip: string; // highlighted quick chip
}

const SCENARIOS: Scenario[] = [
  {
    coachOpener: "Hey! You're 11 days strong. Today's plan is loaded. What's on your mind?",
    userMessage: "I only have 20 minutes today, can you shorten my workout?",
    coachResponse: "Done. Swapped to a 20-min express upper push. You'll still hit chest and shoulders.",
    cardTitle: "Updated Workout",
    cardRows: [
      { left: "Push-ups (3x15)", right: "4 min" },
      { left: "DB Press (3x10)", right: "6 min" },
      { left: "Lateral Raises (3x12)", right: "5 min" },
      { left: "Tricep Dips (2x15)", right: "4 min" },
    ],
    chip: "Adjust today",
  },
  {
    coachOpener: "Afternoon check-in. You're 38g short of your protein target for today.",
    userMessage: "What can I eat for dinner to hit my goal?",
    coachResponse: "Here are three quick options that each get you there. All under 15 minutes.",
    cardTitle: "High-Protein Dinner Options",
    cardRows: [
      { left: "Greek chicken bowl", right: "52g protein" },
      { left: "Cottage cheese + eggs", right: "44g protein" },
      { left: "Salmon + edamame", right: "48g protein" },
    ],
    chip: "Log a meal",
  },
  {
    coachOpener: "Morning. I see you logged 5 hrs sleep. I've lightened today's session.",
    userMessage: "Yeah I'm pretty drained, good call",
    coachResponse: "Swapped leg day for a 20-min mobility session. Protein target stays at 160g.",
    cardTitle: "Today's Adapted Plan",
    cardRows: [
      { left: "Hip flexor stretch", right: "5 min" },
      { left: "Thoracic rotations", right: "5 min" },
      { left: "Glute activation", right: "5 min" },
      { left: "Deep breathing", right: "5 min" },
    ],
    chip: "Adjust today",
  },
  {
    coachOpener: "4/5 workouts done this week. Protein avg 148g. One day to go.",
    userMessage: "What do I need to finish strong this week?",
    coachResponse: "Hit today's workout and reach 160g protein. You'll land a 90+ weekly score.",
    cardTitle: "Weekly Goal Tracker",
    cardRows: [
      { left: "Workouts", right: "4/5 done" },
      { left: "Avg protein", right: "148g / 160g" },
      { left: "Streak", right: "11 days" },
      { left: "Weekly score", right: "88 -> 92+" },
    ],
    chip: "How am I doing?",
  },
];

const CHIPS = ["Adjust today", "Log a meal", "How am I doing?", "Motivate me"];

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "4px 0" }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.1, repeat: Infinity, delay, ease: "easeInOut" }}
          style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#555" }}
        />
      ))}
    </div>
  );
}

function CoachAvatar({ size = 22 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size,
      background: "var(--accent-primary)",
      borderRadius: Math.round(size * 0.32) + "px",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: Math.round(size * 0.4) + "px", fontWeight: 800, color: "#0a0a0a",
      flexShrink: 0,
    }}>K</div>
  );
}

export default function ChatScreen() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const delay = PHASE_DELAYS[phase];
    const timer = setTimeout(() => {
      if (phase < 3) {
        setPhase((p) => p + 1);
      } else {
        // Advance scenario after hold
        setPhase(0);
        setScenarioIdx((s) => (s + 1) % SCENARIOS.length);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, scenarioIdx]);

  const scenario = SCENARIOS[scenarioIdx];

  return (
    <div style={{ height: "100%", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      {/* Chat header */}
      <div style={{
        padding: "10px 12px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", gap: "9px",
        flexShrink: 0,
      }}>
        <CoachAvatar size={32} />
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#f5f5f5" }}>KAIRO Coach</div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "1px" }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--accent-primary)" }}
            />
            <span style={{ fontSize: "8px", color: "var(--accent-primary)" }}>Active now</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={scenarioIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Coach opener */}
            {phase >= 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", gap: "7px", alignItems: "flex-end" }}
              >
                <CoachAvatar />
                <div style={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px 14px 14px 4px", padding: "9px 11px",
                  maxWidth: "80%", fontSize: "8.5px", color: "#e0e0e0", lineHeight: 1.5,
                }}>
                  {scenario.coachOpener}
                </div>
              </motion.div>
            )}

            {/* User message */}
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", justifyContent: "flex-end" }}
              >
                <div style={{
                  background: "#181818", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px 14px 4px 14px", padding: "9px 11px",
                  maxWidth: "78%", fontSize: "8.5px", color: "#e0e0e0", lineHeight: 1.5,
                }}>
                  {scenario.userMessage}
                </div>
              </motion.div>
            )}

            {/* Typing indicator */}
            {phase === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "flex", gap: "7px", alignItems: "flex-end" }}
              >
                <CoachAvatar />
                <div style={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px 14px 14px 4px", padding: "9px 11px",
                }}>
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            {/* Coach response + card */}
            {phase >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", gap: "7px", alignItems: "flex-end" }}
              >
                <CoachAvatar />
                <div style={{
                  background: "#111", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "14px 14px 14px 4px", padding: "9px 11px",
                  maxWidth: "84%", fontSize: "8.5px", color: "#e0e0e0", lineHeight: 1.5,
                }}>
                  {scenario.coachResponse}
                  {/* Inline card */}
                  <div style={{
                    background: "#181818", border: "1px solid rgba(224,255,79,0.3)",
                    borderRadius: "10px", padding: "8px 10px", marginTop: "8px",
                  }}>
                    <div style={{
                      fontSize: "7px", color: "var(--accent-primary)", fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px",
                    }}>
                      {scenario.cardTitle}
                    </div>
                    {scenario.cardRows.map((row, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: "8px", color: "#ccc", padding: "4px 0",
                        borderBottom: i < scenario.cardRows.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}>
                        <span>{row.left}</span>
                        <span style={{ color: "#777" }}>{row.right}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick chips */}
      <div style={{
        display: "flex", gap: "5px", padding: "6px 12px 4px",
        overflowX: "auto", scrollbarWidth: "none", flexShrink: 0,
      }}>
        {CHIPS.map((chip) => {
          const isActive = chip === scenario.chip && phase >= 1;
          return (
            <div key={chip} style={{
              background: isActive ? "rgba(224,255,79,0.1)" : "#111",
              border: `1px solid ${isActive ? "rgba(224,255,79,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "14px", padding: "5px 9px",
              fontSize: "7px", color: isActive ? "var(--accent-primary)" : "#888",
              whiteSpace: "nowrap", cursor: "default", flexShrink: 0,
              transition: "all 0.3s",
            }}>
              {chip}
            </div>
          );
        })}
      </div>

      {/* Input bar */}
      <div style={{
        display: "flex", gap: "6px", alignItems: "center",
        padding: "6px 12px 8px",
        borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
      }}>
        <div style={{
          flex: 1, background: "#111", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "10px", padding: "7px 10px",
          fontSize: "8px", color: "#444",
        }}>
          Ask your coach anything...
        </div>
        <div style={{
          width: "28px", height: "28px", background: "var(--accent-primary)",
          borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, cursor: "default",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </div>

      <PhoneBottomNav active="chat" />
    </div>
  );
}
