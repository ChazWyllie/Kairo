import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Dashboard | Kairo Coaching",
  description:
    "Track your check-ins, view your training plan, and stay connected with your coach.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
