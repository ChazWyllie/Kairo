import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import CoachingSection from "@/components/CoachingSection";
import TemplateShop from "@/components/TemplateShop";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import FAQ from "@/components/FAQ";
import ApplyCTA from "@/components/ApplyCTA";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kairo Fitness — Coaching That Adapts to Your Real Life",
  description:
    "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy. Plus evidence-based training and nutrition guides you can start today.",
  openGraph: {
    title: "Kairo Fitness — Coaching That Adapts to Your Real Life",
    description:
      "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy. Plus training guides you can start on your own.",
    type: "website",
  },
};

/**
 * Full marketing homepage.
 * Server component — Client components (Hero, Navigation, HowItWorks, ApplyCTA,
 * TemplateShop) are imported here; Next.js handles the client/server boundary.
 *
 * Section order:
 *   Navigation (sticky) → Hero → How It Works → Coaching (2 tiers) →
 *   Template Shop (Coming Soon) → Testimonials → About → FAQ → Apply CTA → Footer
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
