import type { Metadata } from "next";
import Script from "next/script";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap"
});

const title = "Prompt Shrinker | Cut Claude & GPT Token Costs 40-70%";
const description =
  "Paste any prompt and get a high-fidelity compressed version that keeps output quality while slashing token spend.";

export const metadata: Metadata = {
  metadataBase: new URL("https://prompt-shrinker.app"),
  title,
  description,
  keywords: [
    "prompt optimization",
    "token reduction",
    "gpt prompt compressor",
    "claude prompt compressor",
    "ai dev tools"
  ],
  openGraph: {
    title,
    description,
    type: "website",
    url: "https://prompt-shrinker.app",
    siteName: "Prompt Shrinker"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${plexMono.variable} min-h-screen bg-[#0d1117] text-slate-100 antialiased`}>
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  );
}
