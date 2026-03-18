import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
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
  title: "Kairo Coaching — Coaching That Adapts to Your Real Life",
  description:
    "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy — so you actually stay consistent. Join the waitlist for founding member pricing.",
  metadataBase: new URL(
    process.env.APP_URL ?? "https://kairo-delta-sand.vercel.app"
  ),
  openGraph: {
    title: "Kairo Coaching — Coaching That Adapts to Your Real Life",
    description:
      "Expert fitness and nutrition coaching that flexes with your schedule, stress, and energy — so you actually stay consistent.",
    type: "website",
    siteName: "Kairo Coaching",
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
      </head>
      <body className={`${inter.variable} antialiased`} nonce={nonce}>
        {children}
      </body>
    </html>
  );
}
