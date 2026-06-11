"use client";

import { motion } from "motion/react";
import { EditorialMast } from "./EditorialMast";
import { SpotlightCard } from "./SpotlightCard";

const STEPS = [
  {
    n: "01",
    label: "TRIGGER",
    title: "Press the key. Anywhere.",
    body:
      "A global hotkey opens the overlay wherever your cursor is — no window switch, no menubar hunt.",
    spec: "⌃ Space · instant",
  },
  {
    n: "02",
    label: "CAPTURE",
    title: "Speak naturally.",
    body:
      "AudioWorklet capture streams straight to Whisper large-v3. Half-sentences, asides, code names — all of it lands.",
    spec: "240ms first token",
  },
  {
    n: "03",
    label: "POLISH",
    title: "AI cleans it up.",
    body:
      "Fillers stripped, punctuation fixed, lists and code identifiers formatted — informed by the app you're typing into.",
    spec: "App-aware · ~400ms",
  },
  {
    n: "04",
    label: "PASTE",
    title: "Lands in place.",
    body:
      "Pasted through the Accessibility API exactly where your caret was. No clipboard hijack, no focus theft.",
    spec: "Zero focus loss",
  },
];

const EXTRAS = [
  {
    label: "Custom dictionary",
    body: "Teach the polish your jargon — product names, acronyms, framework slang.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Two modes",
    body: "Toggle for long thoughts. Hold for quick zaps. Two shortcuts, one muscle memory.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="3" y="8" width="18" height="8" rx="4" />
        <circle cx="8" cy="12" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Local history",
    body: "Every dictation saved to your Mac as plain JSON. Searchable. Deletable. Yours.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    label: "Multilingual",
    body: "English by default. Auto-detect across 90+ languages — even code-mixed speech.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative section">
      <div className="container-x">
        {/* Section header */}
        <div className="grid-editorial">
          <div className="col-span-12 md:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <EditorialMast variant="chip">THE LOOP</EditorialMast>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="headline-md mt-6 text-balance"
              style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
            >
              Four moves.{" "}
              <span className="serif-italic text-grad-amber amber-glow">
                Five seconds.
              </span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="body-prose col-span-12 md:col-span-5 self-end mt-4 md:mt-0"
            style={{ maxWidth: "44ch" }}
          >
            A complete dictation is four discrete beats — trigger, capture,
            polish, paste — each tuned to disappear into your attention.
          </motion.p>
        </div>

        {/* Step cards */}
        <div className="mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <SpotlightCard
                tilt
                className="card-raised gradient-border group relative flex h-full flex-col overflow-hidden p-6"
              >
                <span
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="flex items-center gap-3 text-amber-300">
                  <span className="numeral mono inline-flex items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 text-[11px] font-medium tracking-[0.16em]">
                    {s.n}
                  </span>
                  <span className="mono text-[10.5px] font-medium tracking-[0.18em] text-amber-400/90">
                    {s.label}
                  </span>
                </div>
                <h3
                  className="mt-5 text-balance font-bold tracking-tight"
                  style={{
                    fontSize: "clamp(19px, 1.8vw, 22px)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.022em",
                    color: "var(--color-stone-100)",
                  }}
                >
                  {s.title}
                </h3>
                <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-stone-400">
                  {s.body}
                </p>
                <div className="mono mt-5 inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.16em] text-stone-500">
                  <span className="text-amber-400">▸</span>
                  {s.spec}
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>

        {/* Pull quote */}
        <div className="mt-[clamp(70px,9vw,120px)]">
          <span className="rule-fade" aria-hidden />
          <div className="grid-editorial mt-12">
            <blockquote
              className="hang-quote col-span-12 text-balance text-center md:col-start-2 md:col-span-10"
              style={{
                fontFamily: "var(--font-instrument-serif), Georgia, serif",
                fontStyle: "italic",
                fontSize: "clamp(28px, 4.2vw, 52px)",
                lineHeight: 1.2,
                letterSpacing: "-0.018em",
                color: "var(--color-stone-100)",
              }}
            >
              <span className="text-amber-300">&ldquo;</span>
              Five seconds. Zero context switches.{" "}
              <span className="text-grad-amber">
                The keyboard generation finally got an interface.
              </span>
              <span className="text-amber-300">&rdquo;</span>
            </blockquote>
          </div>
          <span className="rule-fade mt-12" aria-hidden />
        </div>

        {/* Extras — quiet icon rows, no cards */}
        <div className="mt-[clamp(50px,7vw,80px)] grid grid-cols-1 gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
          {EXTRAS.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3.5"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/[0.08] text-amber-300">
                {f.icon}
              </span>
              <div>
                <p className="text-[13.5px] font-semibold tracking-tight text-stone-100">
                  {f.label}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-stone-500">
                  {f.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
