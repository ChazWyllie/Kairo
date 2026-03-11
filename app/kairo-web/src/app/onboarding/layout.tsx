import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile | Kairo Coaching",
  description:
    "Tell us about your goals, training history, and lifestyle so we can build your personalised plan.",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
