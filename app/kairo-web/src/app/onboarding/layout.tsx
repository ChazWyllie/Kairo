import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Complete Your Profile | Kairo Fitness",
  description:
    "Tell us about your goals, training history, and lifestyle so we can build your personalised plan.",
};

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("kairo_session")?.value;

  if (!token || !(await verifySessionToken(token))) {
    redirect("/login");
  }

  return children;
}
