import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set Up Your Account | Kairo Fitness",
  description:
    "Create your password to access your coaching dashboard. Requires a completed checkout.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
