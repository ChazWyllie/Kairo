interface AvatarProps {
  name?: string | null;
  email?: string | null;
  size?: number;
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export default function Avatar({ name, email, size = 40, className = "" }: AvatarProps) {
  const initials = getInitials(name, email);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: "var(--accent-primary)",
        color: "var(--bg-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        flexShrink: 0,
        userSelect: "none",
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
