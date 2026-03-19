import Link from "next/link";
import { Instagram } from "lucide-react";

const NAV_LINKS = [
  { label: "Coaching", href: "#coaching" },
  { label: "Templates", href: "#templates" },
  { label: "About", href: "#about" },
  { label: "FAQ", href: "#faq" },
  { label: "Apply", href: "/apply" },
] as const;

/**
 * Minimal footer — wordmark, navigation links, Instagram icon, copyright.
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
            <li>
              <a
                href="https://instagram.com/kairo.fitness"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Kairo on Instagram"
                className="transition-colors duration-150"
                style={{ color: "var(--text-tertiary)" }}
              >
                <Instagram size={14} />
              </a>
            </li>
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
