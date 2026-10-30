import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import "./site.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const brand = Outfit({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-brand", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif", display: "swap" });

const site = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Holdline: Keep your services. Fight back.", template: "%s · Holdline" },
  description:
    "Holdline checks a letter that cuts your services or benefits against the federal rule that governs it: the real deadline, what the law requires that is missing, and a reply you can send tonight. Every line is a quote or a blank.",
  openGraph: { type: "website", siteName: "Holdline", title: "Holdline: Keep your services. Fight back." },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#07090b" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${brand.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
