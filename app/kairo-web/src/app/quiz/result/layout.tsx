import type { Metadata } from "next";

/**
 * Result page layout — page-specific metadata for SEO + social sharing.
 */
export const metadata: Metadata = {
  title: "Your Recommendation — Kairo Fitness",
  description:
    "Here's the coaching plan we recommend based on your goals, experience, and schedule.",
  openGraph: {
    title: "Your Recommendation — Kairo Fitness",
    description:
      "Your personalized coaching plan recommendation from Kairo.",
    type: "website",
  },
};

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
