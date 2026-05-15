"use client";

import { motion } from "motion/react";
import { EditorialMast } from "./EditorialMast";

const PRINCIPLES = [
  {
    n: "01",
    label: "LOCAL-FIRST",
    title: "Your transcripts never leave your Mac.",
    body:
      "History, dictionary, and settings live as plain JSON in your user data folder. Nothing is uploaded, indexed, or trained on. You can read them, back them up, or delete them with rm. There is no server-side database. There is no server.",
    proof: "0 bytes leave your device",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    n: "02",
    label: "BRING YOUR OWN KEY",
    title: "You pay Groq directly. We pay nothing.",
    body:
      "VoiceFlow uses your Groq API key for transcription and polish. No middleman, no markup, no per-minute pricing. Cost-per-dictation is typically a fraction of a cent — and the bill arrives in your inbox, not ours.",
    proof: "≈ $0.001 per dictation",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="m3.27 6.96 8.73 5.05 8.73-5.05M12 22.08V12" />
      </svg>
    ),
  },
  {
    n: "03",
    label: "OPEN BY DEFAULT",
    title: "MIT licensed. Read every line.",
    body:
      "The whole app — main process, renderer, IPC, transcription pipeline — is on GitHub. Audit it. Fork it. Ship a private build for your company. We'd rather earn your trust than ask for it.",
    proof: "100% source available",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    n: "04",
    label: "macOS, PROPERLY",
    title: "Built around how Macs actually work.",
    body:
      "Tray-first. Accessibility-based paste. JXA for app context. AudioWorklet capture. Native menu items. It feels native because it is — no Electron skin painted over a web app, no cross-platform compromises.",
    proof: "Apple silicon native",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
      >
        <path d="M16.365 1.43c.04 1.07-.357 2.1-1.05 2.86-.7.78-1.84 1.36-2.95 1.27-.06-1.04.43-2.13 1.1-2.84.74-.79 1.99-1.4 2.9-1.29zM20.2 17.42c-.49 1.13-.72 1.62-1.34 2.6-.87 1.36-2.1 3.06-3.62 3.07-1.36.01-1.71-.88-3.55-.86-1.84.01-2.23.88-3.59.87-1.52-.01-2.69-1.55-3.56-2.91-2.43-3.83-2.7-8.32-1.19-10.7C4.42 7.84 6.18 6.83 7.86 6.83c1.66 0 2.7.92 4.08.92 1.34 0 2.16-.92 4.08-.92 1.5 0 3.08.81 4.21 2.21-3.7 2.03-3.1 7.32.97 8.38z" />
      </svg>
    ),
  },
];

export function Choices() {
  return (
    <section
      id="choices"
      className="relative section"
    >
      <div className="container-x">
        <div className="grid-editorial">
          <div className="col-span-12 md:col-span-7">
            <EditorialMast variant="chip">OPINIONS</EditorialMast>
            <h2
              className="headline-md mt-6 text-balance"
              style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
            >
              We made some{" "}
              <span className="serif-italic text-grad-amber">choices</span>{" "}
              on your behalf.
            </h2>
          </div>
          <p
            className="body-prose col-span-12 md:col-span-5 self-end mt-4 md:mt-0"
            style={{ maxWidth: "48ch" }}
          >
            Most voice-to-text tools optimise for the company shipping them.
            VoiceFlow is built on a different bet: you should own the data,
            the cost, and the code. Four decisions, each made deliberately,
            each open to scrutiny.
          </p>
        </div>

        <div className="mt-14 grid gap-3 sm:grid-cols-2">
          {PRINCIPLES.map((p, i) => (
            <PrincipleCard key={p.n} principle={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PrincipleCard({
  principle,
  index,
}: {
  principle: (typeof PRINCIPLES)[number];
  index: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="card-raised group relative overflow-hidden p-7 sm:p-8"
    >
      {/* Top hairline (only visible on hover) */}
      <span
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />

      {/* Hanging numeral */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/[0.08] text-amber-300 transition-colors duration-300 group-hover:bg-amber-500/[0.12] group-hover:border-amber-500/40">
            {principle.icon}
          </div>
          <div>
            <p className="mono text-[10.5px] tracking-[0.18em] uppercase text-amber-400/80">
              {principle.label}
            </p>
            <p
              className="serif-italic text-stone-700 leading-none"
              style={{ fontSize: 24 }}
            >
              №{principle.n}
            </p>
          </div>
        </div>

        <span className="mono inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10.5px] tracking-wider text-stone-400">
          <span className="h-1 w-1 rounded-full bg-emerald-400/70" />
          {principle.proof}
        </span>
      </div>

      <h3
        className="mt-7 text-balance font-bold tracking-tight"
        style={{
          fontSize: "clamp(22px, 2.6vw, 28px)",
          lineHeight: 1.15,
          letterSpacing: "-0.022em",
          color: "var(--color-stone-100)",
        }}
      >
        {principle.title}
      </h3>

      <p
        className="mt-4 text-[14.5px] leading-relaxed text-stone-400"
        style={{ maxWidth: "58ch" }}
      >
        {principle.body}
      </p>
    </motion.article>
  );
}
