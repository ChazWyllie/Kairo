"use client";

import React, { useState } from "react";
import Link from "next/link";
import "./CardNav.css";

/* ── Inline arrow-up-right icon (avoids react-icons dependency) ── */
function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 11.5L11.5 4.5" />
      <path d="M5 4.5H11.5V11" />
    </svg>
  );
}

/* ── Types ── */
type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  logoText?: string;
  items: CardNavItem[];
  className?: string;
  baseColor?: string;
  menuColor?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

const CardNav: React.FC<CardNavProps> = ({
  logoText = "Kairo",
  items,
  className = "",
  baseColor = "#fff",
  menuColor,
  buttonBgColor,
  buttonTextColor,
  ctaHref = "/login",
  ctaLabel = "Get Started",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleMenu = () => setIsExpanded((prev) => !prev);

  return (
    <div className={`card-nav-container ${className}`}>
      <nav
        className={`card-nav ${isExpanded ? "open" : ""}`}
        style={{ backgroundColor: baseColor }}
      >
        <div className="card-nav-top">
          <button
            type="button"
            className={`hamburger-menu ${isExpanded ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            aria-expanded={isExpanded}
            style={{ color: menuColor || "#000" }}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </button>

          <div className="logo-container">
            <Link href="/" className="logo-text">
              {logoText}
            </Link>
          </div>

          <Link
            href={ctaHref}
            className="card-nav-cta-button"
            style={{
              backgroundColor: buttonBgColor,
              color: buttonTextColor,
            }}
          >
            {ctaLabel}
          </Link>
        </div>

        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {(items || []).slice(0, 3).map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="nav-card"
              style={{
                backgroundColor: item.bgColor,
                color: item.textColor,
                transitionDelay: isExpanded ? `${idx * 80}ms` : "0ms",
              }}
            >
              <div className="nav-card-label">{item.label}</div>
              <div className="nav-card-links">
                {item.links?.map((lnk, i) => (
                  <a
                    key={`${lnk.label}-${i}`}
                    className="nav-card-link"
                    href={lnk.href}
                    aria-label={lnk.ariaLabel}
                  >
                    <ArrowUpRight className="nav-card-link-icon" />
                    {lnk.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default CardNav;
