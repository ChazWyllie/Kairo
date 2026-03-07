import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kairo Coaching — Simple, Structured Fitness Coaching",
  description:
    "Personalized training plans, nutrition coaching, and expert accountability. Take the quiz to find your plan.",
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
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
