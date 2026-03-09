import type { NextConfig } from "next";

/**
 * Next.js configuration with defense-in-depth security headers.
 *
 * These headers are a FALLBACK layer. The primary enforcement is in
 * src/middleware.ts (via proxy.ts). If middleware fails to run on a
 * path, these framework-level headers still apply.
 *
 * @see docs/07-security-controls.md §6
 */
const nextConfig: NextConfig = {
  poweredBy: false,
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
