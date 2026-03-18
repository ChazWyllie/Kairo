import Link from "next/link";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Apply", href: "/apply" },
] as const;

/**
 * Minimal footer — wordmark, navigation links, copyright.
 * Server component.
 */
export default function Footer() {
  return (
    <footer
      className="px-5 md:px-10 py-12"
      style={{ borderTop: "1px solid var(--border-subtle)" }}
    >
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6">
        {/* Wordmark */}
        <span
          className="font-display font-bold tracking-[0.15em] text-sm uppercase select-none"
          style={{ color: "var(--text-tertiary)" }}
        >
          Kairo
        </span>

        {/* Nav links */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-6 flex-wrap justify-center">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="text-xs transition-colors duration-150 link-underline"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          &copy; {new Date().getFullYear()} Kairo Fitness. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
