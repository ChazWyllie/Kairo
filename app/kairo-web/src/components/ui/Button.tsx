import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  "aria-label"?: string;
}

const variantClasses: Record<Variant, string> = {
  primary: [
    "bg-accent-primary text-bg-primary font-semibold",
    "hover:-translate-y-px btn-glow",
    "transition-all duration-200",
  ].join(" "),
  secondary: [
    "border border-border-hover text-text-primary bg-transparent",
    "hover:border-text-tertiary",
    "transition-colors duration-200",
  ].join(" "),
  ghost: [
    "text-text-secondary bg-transparent",
    "hover:text-text-primary",
    "transition-colors duration-200",
  ].join(" "),
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-[var(--radius-sm)]",
  md: "px-6 py-3 text-base rounded-[var(--radius-md)]",
  lg: "px-8 py-4 text-lg rounded-[var(--radius-md)]",
};

/**
 * Reusable button/link component.
 * Renders as <Link> when `href` is provided, <button> otherwise.
 */
export default function Button({
  variant = "primary",
  size = "md",
  href,
  onClick,
  children,
  className = "",
  type = "button",
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
