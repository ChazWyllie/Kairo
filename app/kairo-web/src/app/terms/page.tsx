import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "@/components/marketing/Navigation";
import Footer from "@/components/marketing/Footer";

export const metadata: Metadata = {
  title: "Terms of Service | Kairo Fitness",
};

export default function TermsPage() {
  return (
    <>
      <Navigation />
      <main
        className="min-h-screen flex flex-col items-center justify-center px-5 text-center"
        style={{ background: "var(--bg-primary)", paddingTop: "8rem", paddingBottom: "8rem" }}
      >
        <h1
          className="font-display font-black mb-4"
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
          }}
        >
          Terms of Service
        </h1>
        <p className="text-base mb-8" style={{ color: "var(--text-secondary)" }}>
          This page is coming soon.
        </p>
        <Link
          href="/"
          className="text-sm font-medium link-underline"
          style={{ color: "var(--text-secondary)" }}
        >
          &larr; Back to home
        </Link>
      </main>
      <Footer />
    </>
  );
}
