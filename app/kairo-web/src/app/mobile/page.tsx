import type { Metadata } from "next";
import MobileNav from "@/components/marketing/mobile/MobileNav";
import MobileHero from "@/components/marketing/mobile/MobileHero";
import SocialProofBar from "@/components/marketing/mobile/SocialProofBar";
import MobileHowItWorks from "@/components/marketing/mobile/MobileHowItWorks";
import AppShowcase from "@/components/marketing/mobile/AppShowcase";
import DifferentiationStatement from "@/components/marketing/mobile/DifferentiationStatement";
import MobileWaitlist from "@/components/marketing/mobile/MobileWaitlist";
import MobileFooter from "@/components/marketing/mobile/MobileFooter";

export const metadata: Metadata = {
  title: "Kairo App -- Fitness That Adapts When Life Happens",
  description:
    "Tell Kairo your constraints. Get a workout and nutrition plan that fits today -- not the perfect version of your week that never shows up.",
  openGraph: {
    title: "Kairo App -- Fitness That Adapts When Life Happens",
    description:
      "Tell Kairo your constraints. Get a plan that fits today -- not the perfect version of your week that never shows up.",
    type: "website",
  },
};

/**
 * Mobile app landing page.
 * Section order (per spec):
 *   MobileNav -> MobileHero -> SocialProofBar -> MobileHowItWorks ->
 *   AppShowcase -> DifferentiationStatement -> MobileWaitlist -> MobileFooter
 */
export default function MobilePage() {
  return (
    <main className="bg-bg-primary min-h-screen">
      <MobileNav />
      <MobileHero />
      <SocialProofBar />
      <MobileHowItWorks />
      <AppShowcase />
      <DifferentiationStatement />
      <MobileWaitlist />
      <MobileFooter />
    </main>
  );
}
