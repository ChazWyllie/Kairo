"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { track } from "@/lib/analytics";

const CardNav = dynamic(() => import("@/components/CardNav"), { ssr: false });

const NAV_ITEMS = [
  {
    label: "Programs",
    bgColor: "#0D0716",
    textColor: "#fff",
    links: [
      { label: "Apply Now", href: "/apply", ariaLabel: "Apply for coaching" },
    ],
  },
  {
    label: "About",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [
      { label: "Why Kairo", href: "/apply", ariaLabel: "Why choose Kairo" },
    ],
  },
];

/**
 * Waitlist hero: client component handling CardNav + analytics.
 * Used by the waitlist landing page (page.tsx).
 */
export default function WaitlistHero() {
  useEffect(() => {
    track({ name: "page_view", properties: { path: "/" } });
  }, []);

  return (
    <>
      <CardNav
        logoText="Kairo"
        items={NAV_ITEMS}
        baseColor="rgba(0,0,0,0.75)"
        menuColor="#fff"
        buttonBgColor="#fff"
        buttonTextColor="#000"
        ctaHref="/apply"
        ctaLabel="Join Waitlist"
      />

      <section className="relative z-10 mx-auto max-w-3xl px-6 pt-36 pb-24 text-center">
        {/* Floating keyword badges, desktop only, purely decorative */}
        <span
          aria-hidden="true"
          className="hidden sm:flex absolute left-[2%] top-1/3 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 backdrop-blur-sm animate-float"
          style={{ animationDelay: "0s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
          Accountability
        </span>
        <span
          aria-hidden="true"
          className="hidden sm:flex absolute right-[2%] top-2/5 -translate-y-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 backdrop-blur-sm animate-float"
          style={{ animationDelay: "2s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
          Structure
        </span>
        <span
          aria-hidden="true"
          className="hidden sm:flex absolute left-[4%] bottom-1/3 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-neutral-400 backdrop-blur-sm animate-float"
          style={{ animationDelay: "4s" }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
          Results
        </span>

        {/* Headline: weight contrast within one typographic unit */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[0.95] text-white"
          style={{ letterSpacing: "-0.04em" }}
        >
          <span className="block">Coaching that</span>
          <span className="block font-light text-neutral-400">
            adapts to your real life.
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-8 text-base sm:text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed animate-slide-up"
          style={{ animationDelay: "150ms" }}
        >
          Expert fitness coaching is coming. Get early access + founding member
          pricing.
        </p>

        {/* CTA: arrow slides in on hover via gap transition */}
        <div
          className="mt-12 flex flex-col items-center gap-4 animate-slide-up"
          style={{ animationDelay: "250ms" }}
        >
          <Link
            href="/apply"
            onClick={() =>
              track({ name: "cta_click", properties: { location: "waitlist_hero" } })
            }
            className="group inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-white px-10 py-4 text-base font-semibold text-black transition-all duration-300 hover:gap-3 hover:pr-9"
          >
            <span>Join the Waitlist</span>
            <span
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              →
            </span>
          </Link>
          <p
            className="text-xs text-neutral-600 uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            No commitment &middot; Early access
          </p>
        </div>

        {/* Scroll indicator */}
        <div
          aria-hidden="true"
          className="mt-16 flex flex-col items-center gap-2 opacity-30 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <span
            className="text-[10px] text-neutral-500 uppercase"
            style={{ letterSpacing: "0.2em" }}
          >
            Scroll
          </span>
          <div className="h-10 w-px bg-gradient-to-b from-neutral-500 to-transparent" />
        </div>
      </section>
    </>
  );
}
