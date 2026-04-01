import type { Metadata } from "next";
import MobileNav from "@/components/marketing/mobile/MobileNav";
import MobileWaitlist from "@/components/marketing/mobile/MobileWaitlist";
import MobileFooter from "@/components/marketing/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "Join the Kairo Waitlist -- Early Access to Adaptive Fitness",
  description:
    "Be first. Join the Kairo waitlist for early access to the fitness app that adapts your daily plan around real life.",
};

/**
 * Dedicated waitlist page.
 * Minimal layout -- the form is the focus.
 */
export default function WaitlistPage() {
  return (
    <main className="bg-bg-primary min-h-screen flex flex-col">
      <MobileNav />

      {/* Centered content -- fills available height */}
      <div className="flex-1 flex flex-col items-center justify-center pt-20 pb-0">
        <MobileWaitlist />
      </div>

      <MobileFooter />
    </main>
  );
}
