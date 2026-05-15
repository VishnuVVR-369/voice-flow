"use client";

import { motion } from "motion/react";
import { Diff } from "./Diff";
import { DOWNLOAD_URL, REPOSITORY_URL } from "@/lib/download";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
};

const TRUST_CONTEXTS = ["Slack", "Linear", "GitHub", "Mail", "Cursor", "Notion"];

const STATS = [
  {
    value: "240ms",
    label: "First-token latency",
    note: "Whisper-large-v3 on Groq",
  },
  {
    value: "~$0.001",
    label: "Per dictation",
    note: "You pay Groq directly",
  },
  {
    value: "100%",
    label: "On-device storage",
    note: "Plain JSON, deletable",
  },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative pt-[130px] sm:pt-[150px] pb-[60px] overflow-hidden"
    >
      <div className="container-x relative">
        <div className="mx-auto max-w-3xl text-center">
          {/* Eyebrow chip */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <span className="eyebrow-chip">
              <span className="eyebrow-chip__dot" />
              Voice → text · for macOS · v0.1.0
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="headline mt-7 text-balance"
            style={{ fontSize: "clamp(48px, 8.5vw, 112px)" }}
          >
            Speak. We&rsquo;ll write it{" "}
            <span className="serif-italic text-grad-amber">properly</span>.
          </motion.h1>

          {/* Sub-lead */}
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
            className="mt-7 mx-auto body-prose max-w-[640px]"
            style={{ fontSize: "clamp(17px, 1.3vw, 20px)" }}
          >
            Hold a hotkey, talk naturally, and what gets pasted reads like you
            typed it. Filler words gone. Punctuation correct. Formatting
            handled. Right where your cursor was.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a href={DOWNLOAD_URL} className="btn-primary w-full sm:w-auto">
              <svg
                width="14"
                height="14"
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
              className="btn-ghost w-full sm:w-auto"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.88-1.36-3.88-1.36-.53-1.35-1.29-1.71-1.29-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.41-1.27.74-1.56-2.55-.29-5.24-1.27-5.24-5.67 0-1.25.45-2.27 1.18-3.08-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.24 2.74.12 3.03.74.81 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.42.36.79 1.08.79 2.18v3.23c0 .31.21.67.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
              </svg>
              View source
            </a>
          </motion.div>

          {/* Microcopy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-5 text-[12px] text-stone-600"
          >
            MIT licensed · Bring your own Groq key · macOS 13+
          </motion.p>

          {/* Compatibility chips */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
          >
            <span className="mast text-stone-500">Works in</span>
            {TRUST_CONTEXTS.map((ctx, i) => (
              <span
                key={ctx}
                className="rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1 text-[11.5px] text-stone-300 backdrop-blur-md transition-colors hover:border-amber-500/30 hover:text-amber-200"
                style={{
                  animation: `float-y 6s ease-in-out infinite`,
                  animationDelay: `${-i * 0.7}s`,
                }}
              >
                {ctx}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Stats — three quiet metric cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.85 }}
          className="mt-14 grid gap-3 sm:grid-cols-3"
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              className="card-raised relative overflow-hidden p-5 text-left"
            >
              <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
              <p className="mono text-[24px] tracking-tight text-amber-300">
                {s.value}
              </p>
              <p className="mt-2 text-[14px] font-medium text-stone-200">
                {s.label}
              </p>
              <p className="mt-1 text-[12px] leading-relaxed text-stone-500">
                {s.note}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Hero spotlight: the live morph diff */}
      <div className="mt-16 sm:mt-20">
        <Diff />
      </div>
    </section>
  );
}
