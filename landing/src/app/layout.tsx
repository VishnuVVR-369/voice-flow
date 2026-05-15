import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Instrument_Serif,
  Fraunces,
} from "next/font/google";
import "./globals.css";

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

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${fraunces.variable} antialiased`}
    >
      <body className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans">
        {children}
      </body>
    </html>
  );
}
