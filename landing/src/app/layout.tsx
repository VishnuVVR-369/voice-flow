import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ScrollProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "VoiceFlow — Speak. We'll write it properly.",
  description:
    "VoiceFlow turns your voice into clean, formatted text and pastes it into any Mac app. Hold a hotkey, talk, done.",
  metadataBase: new URL("https://voiceflow.app"),
  openGraph: {
    title: "VoiceFlow — Speak. We'll write it properly.",
    description:
      "Voice-to-text for macOS with built-in AI polish. Local. Open source. BYO Groq key.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <body className="relative min-h-screen overflow-x-clip bg-[var(--color-ink)] text-stone-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
        {/* Global ambient atmosphere */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-noise opacity-[0.03]"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed top-[-280px] left-1/2 -translate-x-1/2 h-[680px] w-[1100px] rounded-full bg-amber-500/[0.06] blur-[160px] animate-breathe"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed top-[18%] right-[-14%] h-[420px] w-[420px] rounded-full bg-orange-500/[0.035] blur-[140px] animate-drift"
        />
        <div
          aria-hidden
          className="pointer-events-none fixed bottom-[-200px] left-[-12%] h-[460px] w-[520px] rounded-full bg-amber-700/[0.045] blur-[140px] animate-drift"
          style={{ animationDelay: "-6s" }}
        />
        {/* Slow rotating conic — barely visible, adds life to the void */}
        <div
          aria-hidden
          className="pointer-events-none fixed top-[-40vh] left-1/2 -translate-x-1/2 h-[140vh] w-[140vh] opacity-[0.05] animate-slow-spin"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(245,158,11,0.6) 90deg, transparent 180deg, rgba(251,146,60,0.4) 270deg, transparent 360deg)",
            maskImage:
              "radial-gradient(ellipse at center, black 0%, transparent 60%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 0%, transparent 60%)",
          }}
        />

        <ScrollProgress />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
