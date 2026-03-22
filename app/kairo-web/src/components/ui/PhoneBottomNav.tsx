"use client";

type Tab = "today" | "log" | "plan" | "chat" | "me";

interface Props {
  active: Tab;
}

const TABS: { id: Tab; label: string; d: string }[] = [
  {
    id: "today",
    label: "Today",
    d: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  },
  {
    id: "log",
    label: "Log",
    d: "M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
  },
  {
    id: "plan",
    label: "Plan",
    d: "M3 4h18v18H3z M16 2v4 M8 2v4 M3 10h18",
  },
  {
    id: "chat",
    label: "Chat",
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    id: "me",
    label: "Me",
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

export default function PhoneBottomNav({ active }: Props) {
  return (
    <div
      style={{
        height: "52px",
        background: "#0d0d0d",
        borderTop: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <div
            key={tab.id}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              cursor: "default",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive ? "var(--accent-primary)" : "#444"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={tab.d} />
            </svg>
            <span
              style={{
                fontSize: "6px",
                color: isActive ? "var(--accent-primary)" : "#444",
                fontWeight: isActive ? 700 : 400,
              }}
            >
              {tab.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
