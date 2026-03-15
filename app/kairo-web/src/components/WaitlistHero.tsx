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
    links: [{ label: "Apply Now", href: "/apply", ariaLabel: "Apply for coaching" }],
  },
  {
    label: "About",
    bgColor: "#271E37",
    textColor: "#fff",
    links: [{ label: "How it works", href: "/apply", ariaLabel: "How Kairo coaching works" }],
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
        ctaLabel="Apply Now"
      />

      <section className="mx-auto max-w-3xl px-6 pt-28 pb-16 text-center sm:pt-32 sm:pb-20">
        <p className="inline-flex rounded-full border border-neutral-800 bg-neutral-900 px-3 py-1 text-xs font-medium tracking-wide text-neutral-300">
          Waitlist open · Limited founding spots
        </p>

        <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight text-white">
          Coaching that adapts to your real life.
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
          Skip generic plans. Apply now and we&apos;ll review your goals,
          constraints, and timeline to see if Kairo is the right fit.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/apply"
            onClick={() =>
              track({ name: "cta_click", properties: { location: "waitlist_hero_primary" } })
            }
            className="inline-flex w-full items-center justify-center rounded-xl bg-white px-8 py-3 text-base font-semibold text-black shadow-lg transition-colors hover:bg-neutral-200 sm:w-auto"
          >
            Apply Now
          </Link>
          <Link
            href="/apply"
            onClick={() =>
              track({ name: "cta_click", properties: { location: "waitlist_hero_secondary" } })
            }
            className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-700 px-8 py-3 text-base font-medium text-neutral-200 transition-colors hover:border-neutral-500 hover:text-white sm:w-auto"
          >
            See the application flow
          </Link>
        </div>

        <div className="mt-5 grid gap-2 text-xs text-neutral-400 sm:grid-cols-3">
          <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">No rigid templates</p>
          <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">Real-coach review</p>
          <p className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2">No payment required to apply</p>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          2–3 minute application · Reply in 24–48 hours
        </p>
      </section>
    </>
  );
}
