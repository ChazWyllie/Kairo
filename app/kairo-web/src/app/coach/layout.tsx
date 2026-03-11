import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coach Dashboard | Kairo Coaching",
  description:
    "Monitor client health, review check-ins, and manage your coaching portfolio.",
};

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
