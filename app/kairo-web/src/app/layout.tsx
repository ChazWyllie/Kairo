import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Kairo Coaching — Simple, Structured Fitness Coaching",
  description:
    "Personalized training plans, nutrition coaching, and expert accountability. Apply now to get started.",
  metadataBase: new URL(
    process.env.APP_URL ?? "https://kairo-delta-sand.vercel.app"
  ),
  openGraph: {
    title: "Kairo Coaching — Simple, Structured Fitness Coaching",
    description:
      "Personalized training plans, nutrition coaching, and expert accountability.",
    type: "website",
    siteName: "Kairo Coaching",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
