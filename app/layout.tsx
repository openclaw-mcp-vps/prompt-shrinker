import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";

import "./globals.css";

const headlineFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-headline"
});

const monoFont = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://prompt-shrinker.app"),
  title: "Prompt Shrinker — cut Claude/GPT token costs 40-70% automatically",
  description:
    "Paste any prompt and automatically compress it to reduce Claude/GPT token spend while preserving output quality.",
  keywords: [
    "prompt compression",
    "AI token optimization",
    "OpenAI cost reduction",
    "Anthropic prompt optimizer",
    "developer tools"
  ],
  openGraph: {
    title: "Prompt Shrinker",
    description:
      "Cut Claude/GPT token costs 40-70% automatically with a team-friendly web app and API.",
    type: "website",
    url: "https://prompt-shrinker.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "Prompt Shrinker",
    description:
      "Compress prompts without sacrificing quality. Built for AI-heavy engineering teams."
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headlineFont.variable} ${monoFont.variable} dark`}>
      <body className="font-[var(--font-headline)] antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#0f172a",
              color: "#e2e8f0",
              border: "1px solid #1e293b"
            }
          }}
        />
      </body>
    </html>
  );
}
