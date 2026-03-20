import type { MetadataRoute } from "next";

/**
 * robots.txt — allow all crawlers, point to sitemap.
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.APP_URL ?? "https://kairo-delta-sand.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/onboarding", "/success", "/login", "/register", "/coach"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
