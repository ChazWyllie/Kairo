import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import About from "@/components/About";
import FAQ from "@/components/FAQ";
import ApplyCTA from "@/components/ApplyCTA";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kairo Fitness — Coaching That Adapts to Your Real Life",
  description:
    "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy — so you actually stay consistent. Join the waitlist for founding member pricing.",
  openGraph: {
    title: "Kairo Fitness — Coaching That Adapts to Your Real Life",
    description:
      "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy — so you actually stay consistent.",
    type: "website",
  },
};

/**
 * Full marketing homepage.
 * Server component — Client components (Hero, Navigation, Pricing, FAQ, ApplyCTA)
 * are imported here; Next.js handles the client/server boundary automatically.
 *
 * Section order:
 *   Navigation (sticky) → Hero → How It Works → Testimonials →
 *   Pricing → About → FAQ → Apply CTA → Footer
 */
export default function HomePage() {
  return (
    <main className="bg-bg-primary min-h-screen">
      <Navigation />
      <Hero />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <About />
      <FAQ />
      <ApplyCTA />
      <Footer />
    </main>
  );
}
