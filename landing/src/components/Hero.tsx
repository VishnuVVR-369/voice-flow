"use client";

import { motion } from "motion/react";
import { Diff } from "./Diff";
import { EditorialMast } from "./EditorialMast";
import { DOWNLOAD_URL, REPOSITORY_URL } from "@/lib/download";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section
      id="top"
      className="relative pt-[120px] sm:pt-[140px] pb-[60px] overflow-hidden"
    >
      <div className="container-x relative">
        {/* Top masthead row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between"
        >
          <EditorialMast flank={false}>
            <span aria-hidden style={{ color: "var(--color-coral)" }}>
              ◇{" "}
            </span>
            VOICEFLOW DAILY
          </EditorialMast>
          <EditorialMast flank={false}>
            ISSUE №001 · MAY 2026 · DICTATION
          </EditorialMast>
        </motion.div>

        <span className="rule mt-5" aria-hidden />

        {/* Headline */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="headline mt-12 sm:mt-16 text-balance"
          style={{
            fontSize: "clamp(56px, 10vw, 144px)",
          }}
        >
          Speak.
          <br />
          We&rsquo;ll write it{" "}
          <span className="serif-italic italic-lig">properly</span>.
        </motion.h1>

        {/* Sub-lead */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          className="mt-9 max-w-[640px] body-prose"
          style={{ fontSize: "clamp(17px, 1.4vw, 21px)" }}
        >
          Voice-to-text for macOS. Hold a hotkey, speak naturally, and what
          gets pasted reads like you typed it. Filler words gone. Punctuation
          correct. Formatting handled.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7"
        >
          <a href={DOWNLOAD_URL} className="btn-primary inline-flex">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M16.365 1.43c.04 1.07-.357 2.1-1.05 2.86-.7.78-1.84 1.36-2.95 1.27-.06-1.04.43-2.13 1.1-2.84.74-.79 1.99-1.4 2.9-1.29zM20.2 17.42c-.49 1.13-.72 1.62-1.34 2.6-.87 1.36-2.1 3.06-3.62 3.07-1.36.01-1.71-.88-3.55-.86-1.84.01-2.23.88-3.59.87-1.52-.01-2.69-1.55-3.56-2.91-2.43-3.83-2.7-8.32-1.19-10.7C4.42 7.84 6.18 6.83 7.86 6.83c1.66 0 2.7.92 4.08.92 1.34 0 2.16-.92 4.08-.92 1.5 0 3.08.81 4.21 2.21-3.7 2.03-3.1 7.32.97 8.38z" />
            </svg>
            Download for Mac
          </a>
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            View source on GitHub
            <span aria-hidden style={{ color: "var(--color-coral)" }}>
              →
            </span>
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-7 mast"
          style={{ color: "var(--color-ink-muted)" }}
        >
          MIT
          <span style={{ color: "var(--color-coral)", margin: "0 12px" }}>
            ·
          </span>
          OPEN SOURCE
          <span style={{ color: "var(--color-coral)", margin: "0 12px" }}>
            ·
          </span>
          macOS 13+
          <span style={{ color: "var(--color-coral)", margin: "0 12px" }}>
            ·
          </span>
          v0.1.0
        </motion.p>
      </div>

      {/* Full-bleed Diff */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
        className="mt-20 sm:mt-24"
      >
        <Diff />
      </motion.div>
    </section>
  );
}
