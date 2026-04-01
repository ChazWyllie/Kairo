import type { Metadata } from "next";
import Navigation from "@/components/marketing/Navigation";
import Hero from "@/components/marketing/Hero";
import HowItWorks from "@/components/marketing/HowItWorks";
import CoachingSection from "@/components/marketing/CoachingSection";
import TemplateShop from "@/components/marketing/TemplateShop";
import Testimonials from "@/components/marketing/Testimonials";
import About from "@/components/marketing/About";
import FAQ from "@/components/marketing/FAQ";
import ApplyCTA from "@/components/marketing/ApplyCTA";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Kairo Fitness -- Coaching That Adapts to Your Real Life",
  description:
    "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy. Plus evidence-based training and nutrition guides you can start today.",
  openGraph: {
    title: "Kairo Fitness -- Coaching That Adapts to Your Real Life",
    description:
      "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy. Plus training guides you can start on your own.",
    type: "website",
  },
};

/**
 * Full marketing homepage.
 * Server component -- Client components (Hero, Navigation, HowItWorks, ApplyCTA,
 * TemplateShop) are imported here; Next.js handles the client/server boundary.
 *
 * Section order:
 *   Navigation (sticky) -> Hero -> How It Works -> Coaching (2 tiers) ->
 *   Template Shop (Coming Soon) -> Testimonials -> About -> FAQ -> Apply CTA -> Footer
 */
export default function HomePage() {
  return (
    <main className="bg-bg-primary min-h-screen">
      <Navigation />
      <Hero />
      <HowItWorks />
      <CoachingSection />
      <TemplateShop />
      <Testimonials />
      <About />
      <FAQ />
      <ApplyCTA />
      <Footer />
    </main>
  );
}
