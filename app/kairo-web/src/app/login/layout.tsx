import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | Kairo Coaching",
  description:
    "Sign in to your Kairo Coaching account to access your dashboard and training plan.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
