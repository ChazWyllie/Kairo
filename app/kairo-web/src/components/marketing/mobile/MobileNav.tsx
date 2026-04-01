"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { label: "How It Works", href: "/mobile/how-it-works" },
  { label: "Features", href: "/mobile/features" },
  { label: "Waitlist", href: "/mobile/waitlist" },
] as const;

/**
 * Fixed navigation for the /mobile landing section.
 * Frosted glass on scroll. Hamburger menu on mobile.
 * CTA: "Get Early Access" -> /mobile/waitlist
 */
export default function MobileNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: isScrolled || menuOpen ? "rgba(10,10,10,0.92)" : "transparent",
          backdropFilter: isScrolled || menuOpen ? "blur(20px)" : "none",
          WebkitBackdropFilter: isScrolled || menuOpen ? "blur(20px)" : "none",
          borderBottom: isScrolled && !menuOpen
            ? "1px solid var(--border-subtle)"
            : "1px solid transparent",
          transition: "background 0.3s ease, border-color 0.3s ease",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between px-5 md:px-10"
          style={{ height: "64px", maxWidth: "1200px" }}
        >
          {/* Logo */}
          <Link
            href="/"
            className="font-display font-bold tracking-[0.12em] text-sm uppercase"
            style={{ color: "var(--text-primary)", letterSpacing: "0.15em" }}
            onClick={closeMenu}
          >
            Kairo
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Mobile app navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm transition-colors duration-150 link-underline"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-primary)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/mobile/waitlist"
              className="rounded-[var(--radius-sm)] px-5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-px btn-glow"
              style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
            >
              Get Early Access
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[6px]"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span
              className="block w-5 h-px transition-all duration-300 origin-center"
              style={{
                background: "var(--text-primary)",
                transform: menuOpen ? "translateY(4px) rotate(45deg)" : "none",
              }}
            />
            <span
              className="block w-5 h-px transition-all duration-300"
              style={{ background: "var(--text-primary)", opacity: menuOpen ? 0 : 1 }}
            />
            <span
              className="block w-5 h-px transition-all duration-300 origin-center"
              style={{
                background: "var(--text-primary)",
                transform: menuOpen ? "translateY(-4px) rotate(-45deg)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-40 md:hidden flex flex-col pt-20 px-5 pb-8"
        style={{
          background: "var(--bg-primary)",
          pointerEvents: menuOpen ? "auto" : "none",
          opacity: menuOpen ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
        aria-hidden={!menuOpen}
      >
        <nav className="flex flex-col gap-2 flex-1">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeMenu}
              className="py-4 text-2xl font-display font-bold border-b"
              style={{
                color: "var(--text-primary)",
                borderColor: "var(--border-subtle)",
                letterSpacing: "-0.02em",
                transitionDelay: menuOpen ? `${i * 40}ms` : "0ms",
                transform: menuOpen ? "translateY(0)" : "translateY(12px)",
                opacity: menuOpen ? 1 : 0,
                transition: "transform 0.3s ease, opacity 0.3s ease",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/mobile/waitlist"
          onClick={closeMenu}
          className="block w-full text-center rounded-[var(--radius-md)] py-4 text-base font-semibold mt-8"
          style={{ background: "var(--accent-primary)", color: "var(--bg-primary)" }}
        >
          Get Early Access
        </Link>
      </div>
    </>
  );
}
