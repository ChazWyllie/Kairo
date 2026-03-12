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
 * Waitlist hero — client component handling CardNav + analytics.
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
        baseColor="#000"
        menuColor="#fff"
        buttonBgColor="#fff"
        buttonTextColor="#000"
        ctaHref="/apply"
        ctaLabel="Join Waitlist"
      />

      <section className="mx-auto max-w-3xl px-6 pt-32 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight text-white">
          Coaching that adapts to your real life.
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Expert fitness coaching is coming. Get early access + founding member
          pricing.
        </p>
        <div className="mt-10">
          <Link
            href="/apply"
            onClick={() =>
              track({ name: "cta_click", properties: { location: "waitlist_hero" } })
            }
            className="inline-block rounded-xl bg-white px-10 py-4 text-lg font-semibold text-black shadow-lg hover:bg-neutral-200 transition-colors"
          >
            Join the Waitlist
          </Link>
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          No commitment required &middot; Early access benefits
        </p>
      </section>
    </>
  );
}
