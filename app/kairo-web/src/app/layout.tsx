import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kairo Fitness | Coaching That Adapts to Your Real Life",
  description:
    "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy, so you actually stay consistent. Join the waitlist for founding member pricing.",
  metadataBase: new URL(
    process.env.APP_URL ?? "https://kairo.business"
  ),
  openGraph: {
    title: "Kairo Fitness | Coaching That Adapts to Your Real Life",
    description:
      "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy, so you actually stay consistent.",
    type: "website",
    siteName: "Kairo Fitness",
    images: [{ url: "/icon-512.svg", width: 512, height: 512, alt: "Kairo Fitness" }],
  },
  twitter: {
    card: "summary",
    title: "Kairo Fitness | Coaching That Adapts to Your Real Life",
    description:
      "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy, so you actually stay consistent.",
    images: ["/icon-512.svg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="en">
      <head>
        {/* Cabinet Grotesk — from Fontshare (not available on Google Fonts) */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
          nonce={nonce}
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&display=swap"
          nonce={nonce}
        />
        {/* Favicon */}
        <link rel="icon" href="/icon-512.svg" type="image/svg+xml" />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Kairo" />
        <meta name="theme-color" content="#0A0A0A" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} antialiased`} nonce={nonce}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
