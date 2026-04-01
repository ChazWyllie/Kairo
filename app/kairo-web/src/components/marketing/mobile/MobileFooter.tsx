import Link from "next/link";

const COL2_LINKS = [
  { label: "How It Works", href: "/mobile/how-it-works" },
  { label: "Features", href: "/mobile/features" },
  { label: "Waitlist", href: "/mobile/waitlist" },
];

const COL3_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
];

/**
 * Three-column footer for mobile app landing pages.
 * Desktop: 3-column grid. Mobile: stacked.
 * Server component.
 */
export default function MobileFooter() {
  return (
    <footer
      className="px-5 md:px-10 py-16"
      style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-secondary)" }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Three columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-12">
          {/* Col 1: Brand */}
          <div className="flex flex-col gap-4">
            <span
              className="font-display font-bold tracking-[0.15em] text-sm uppercase"
              style={{ color: "var(--text-primary)" }}
            >
              Kairo
            </span>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-tertiary)" }}
            >
              Fitness that fits your real life.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="flex flex-col gap-3">
            <span
              className="text-xs font-medium uppercase tracking-[0.1em] mb-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              App
            </span>
            {COL2_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-150 link-underline w-fit"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Col 3: Legal */}
          <div className="flex flex-col gap-3">
            <span
              className="text-xs font-medium uppercase tracking-[0.1em] mb-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Company
            </span>
            {COL3_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-150 link-underline w-fit"
                style={{ color: "var(--text-secondary)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 text-center text-xs"
          style={{
            borderTop: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
          }}
        >
          &copy; {new Date().getFullYear()} Kairo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
