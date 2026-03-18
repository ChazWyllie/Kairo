import type { Metadata } from "next";

/**
 * Quiz flow layout — provides page-specific metadata for SEO + social sharing.
 */
export const metadata: Metadata = {
  title: "Find Your Plan — Kairo Fitness",
  description:
    "Answer 5 quick questions and get a personalized coaching recommendation. Takes 60 seconds.",
  openGraph: {
    title: "Find Your Plan — Kairo Fitness",
    description:
      "Answer 5 quick questions and get a personalized coaching recommendation.",
    type: "website",
  },
};

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
