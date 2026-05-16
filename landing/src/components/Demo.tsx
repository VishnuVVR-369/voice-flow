"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  AnimatePresence,
} from "motion/react";
import { EditorialMast } from "./EditorialMast";
import { Waveform } from "./Waveform";
import { SpotlightCard } from "./SpotlightCard";

type Beat = {
  n: string;
  label: string;
  title: string;
  body: string;
  spec: string;
};

const BEATS: Beat[] = [
  {
    n: "01",
    label: "TRIGGER",
    title: "Press the key. Anywhere.",
    body:
      "Global hotkey, registered through macOS Accessibility. No window switch, no menubar hunt — the overlay opens wherever your cursor is and starts listening before you finish the gesture.",
    spec: "⌃ + Space · ~0ms",
  },
  {
    n: "02",
    label: "CAPTURE",
    title: "Speak. We listen properly.",
    body:
      "AudioWorklet capture at native sample rate, streamed to Groq's Whisper-large-v3. Your half-sentences, asides, code names — all of it lands. The pill stays out of your way: always-on-top, click-through, breathing with your voice.",
    spec: "Whisper-large-v3 · 240ms first token",
  },
  {
    n: "03",
    label: "POLISH",
    title: "We clean the rough edges.",
    body:
      "A second pass through an LLM strips filler, fixes punctuation, capitalizes proper nouns, and reformats lists, code identifiers, and email greetings — informed by the app you're typing into.",
    spec: "App-aware polish · ~400ms",
  },
  {
    n: "04",
    label: "PASTE",
    title: "Polished text. In place.",
    body:
      "VoiceFlow pastes through the Accessibility API, so the text lands exactly where your caret was — Slack thread, Cursor file, Mail compose, terminal. No clipboard hijack, no focus theft.",
    spec: "AX paste · zero focus loss",
  },
];

const FOOTNOTES = [
  {
    label: "Custom dictionary",
    body:
      "Teach the polish your jargon — product names, internal acronyms, framework slang.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Two modes",
    body:
      "Toggle for long thoughts. Hold for quick zaps. Two shortcuts, one muscle memory.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <rect x="3" y="8" width="18" height="8" rx="4" />
        <circle cx="8" cy="12" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Local history",
    body:
      "Every dictation saved to your Mac as plain JSON. Searchable. Deletable. Yours.",
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
    body:
      "English by default. Auto-detect across 90+ languages — including code-mixed speech.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
];

export function Demo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const stepValue = useTransform(
    scrollYProgress,
    [0.05, 0.32, 0.58, 0.84],
    [0, 1, 2, 3]
  );

  useMotionValueEvent(stepValue, "change", (v) => {
    const next = Math.min(3, Math.max(0, Math.round(v)));
    setStep(next);
  });

  return (
    <section id="demo" ref={sectionRef} className="relative section">
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
              <EditorialMast variant="chip">WORKFLOW — LIVE</EditorialMast>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.95,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.1,
              }}
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
            Scroll to watch each one move.
          </motion.p>
        </div>

        <span className="rule mt-14" aria-hidden />

        {/* Scroll-driven narrative */}
        <div className="mt-12">
          <div className="grid-editorial relative">
            {/* Left rail with active marker */}
            <div className="hidden md:block md:col-span-1">
              <div
                className="sticky w-full"
                style={{ top: "30vh", height: "32vh" }}
              >
                <div className="relative h-full w-px mx-auto bg-white/[0.06]">
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-amber-400/0 via-amber-400 to-amber-400/0"
                    animate={{
                      top: `${step * 25}%`,
                      height: "25%",
                    }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            </div>

            {/* Beat blocks */}
            <div className="col-span-12 md:col-span-5">
              {BEATS.map((b, i) => (
                <BeatBlock key={b.n} beat={b} index={i} activeIndex={step} />
              ))}
            </div>

            {/* Sticky stage on the right */}
            <div className="hidden md:block md:col-span-6">
              <div
                className="sticky"
                style={{ top: "18vh", height: "64vh" }}
              >
                <Stage step={step} />
              </div>
            </div>
          </div>
        </div>

        {/* Pull quote */}
        <div className="mt-[clamp(80px,10vw,140px)]">
          <span className="rule-fade" aria-hidden />
          <div className="grid-editorial mt-12">
            <blockquote
              className="hang-quote col-span-12 md:col-start-2 md:col-span-10 text-balance text-center"
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

        {/* Footnotes */}
        <div className="mt-[clamp(60px,8vw,100px)]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <EditorialMast variant="chip">EXTRAS</EditorialMast>
          </motion.div>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FOOTNOTES.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <SpotlightCard className="card-raised group h-full p-5">
                  <motion.div
                    whileHover={{ rotate: -6, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                    className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/[0.08] text-amber-300 transition-colors group-hover:bg-amber-500/[0.12] group-hover:border-amber-500/30"
                  >
                    {f.icon}
                  </motion.div>
                  <p className="text-[14px] font-semibold tracking-tight text-stone-100">
                    {f.label}
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-stone-500">
                    {f.body}
                  </p>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BeatBlock({
  beat,
  index,
  activeIndex,
}: {
  beat: Beat;
  index: number;
  activeIndex: number;
}) {
  const isActive = index === activeIndex;
  return (
    <div
      className="relative flex flex-col justify-center"
      style={{
        minHeight: "clamp(70vh, 80vh, 90vh)",
        paddingRight: "clamp(0px, 4vw, 48px)",
      }}
    >
      <motion.div
        animate={{ opacity: isActive ? 1 : 0.35 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="flex items-center gap-3 text-amber-300">
          <span
            className="numeral mono inline-flex items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/[0.08] px-2 py-0.5 text-[11px] font-medium tracking-[0.16em]"
          >
            {beat.n}
          </span>
          <span
            className="mono text-[11px] font-medium tracking-[0.18em] text-amber-400/90"
          >
            {beat.label}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-amber-500/30 to-transparent" />
        </div>

        <h3
          className="mt-5 text-balance font-bold tracking-tight"
          style={{
            fontSize: "clamp(28px, 3.4vw, 44px)",
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            color: "var(--color-stone-100)",
          }}
        >
          {beat.title}
        </h3>

        <p className="mt-5 body-prose" style={{ maxWidth: "52ch" }}>
          {beat.body}
        </p>

        <div
          className="mt-6 mono inline-flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-stone-500"
        >
          <span className="text-amber-400">▸</span>
          {beat.spec}
        </div>

        {/* Mobile-only inline stage */}
        <div className="md:hidden mt-10">
          <MobileStageCard step={index} />
        </div>
      </motion.div>
    </div>
  );
}

function Stage({ step }: { step: number }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.07]"
      style={{
        background:
          "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)",
        boxShadow:
          "0 60px 140px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Inner ambient bloom */}
      <span
        className="pointer-events-none absolute top-[-160px] left-1/2 -translate-x-1/2 h-[320px] w-[600px] rounded-full bg-amber-500/[0.06] blur-[100px]"
        aria-hidden
      />

      {/* Stage header */}
      <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="win-dot" style={{ background: "#4b4845" }} />
          <span className="win-dot" style={{ background: "#4b4845" }} />
          <span className="win-dot" style={{ background: "#4b4845" }} />
        </div>
        <span className="rounded-md bg-white/[0.04] px-3 py-1 mono text-[11px] tracking-wider text-stone-500">
          #eng — Slack
        </span>
        <span className="mono text-[10.5px] uppercase tracking-[0.18em] text-stone-600">
          {String(step + 1).padStart(2, "0")} / 04
        </span>
      </div>

      {/* Stage body */}
      <div
        className="relative flex flex-col"
        style={{ height: "calc(100% - 49px)" }}
      >
        {/* Chat area */}
        <div className="flex-1 overflow-hidden" style={{ padding: "28px 24px 0" }}>
          {/* Previous message */}
          <div className="flex items-start gap-3 mb-5 opacity-65">
            <span
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-stone-700/80 text-[10px] font-semibold text-stone-300"
            >
              A
            </span>
            <div>
              <div className="mono text-[11px] tracking-wider text-stone-500">
                alex · 2:14 PM
              </div>
              <p className="mt-1 text-[14px] leading-relaxed text-stone-400">
                any update on the auth fix timeline?
              </p>
            </div>
          </div>

          {/* User message */}
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-black"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-amber-400) 0%, var(--color-orange-500) 100%)",
              }}
            >
              Y
            </span>
            <div className="flex-1">
              <div className="mono text-[11px] tracking-wider text-stone-500">
                you · just now
              </div>
              <AnimatePresence mode="wait">
                {step === 3 ? (
                  <motion.p
                    key="pasted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-1 text-[14px] leading-relaxed text-stone-100"
                  >
                    <TypedReveal text="We should ship the auth fix on Tuesday. Also — can you let the team know about the meeting on Friday?" />
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 mono italic text-[13px] text-stone-600"
                  >
                    <span aria-hidden className="text-stone-500">│</span>{" "}
                    {step === 0
                      ? "type a message…"
                      : step === 1
                      ? "listening…"
                      : "polishing…"}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Floating pill / keycap prompt */}
        <div
          className="absolute left-0 right-0 flex items-center justify-center"
          style={{ bottom: "clamp(28px, 5vw, 56px)" }}
        >
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="trigger"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-2 backdrop-blur-md"
              >
                <span className="keycap">⌃</span>
                <span className="text-stone-500">+</span>
                <span className="keycap">Space</span>
                <span className="mast ml-1.5 text-stone-500">to dictate</span>
              </motion.div>
            )}
            {step === 1 && <Pill key="capture" mode="recording" />}
            {step === 2 && <Pill key="polish" mode="polishing" />}
            {step === 3 && (
              <motion.span
                key="pasted-mark"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-1.5 mono text-[11px] tracking-[0.16em] uppercase text-emerald-300"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Pasted in place
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Pill({ mode }: { mode: "recording" | "polishing" }) {
  const isRecording = mode === "recording";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      {/* Halo */}
      {isRecording && (
        <>
          <span
            className="absolute inset-[-25%] rounded-full animate-pulse-ring"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 65%)",
            }}
          />
          <span
            className="absolute inset-[-25%] rounded-full animate-pulse-ring"
            style={{
              background:
                "radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 65%)",
              animationDelay: "1.2s",
            }}
          />
        </>
      )}

      <div
        className="relative inline-flex items-center gap-3 rounded-full px-4 py-2.5 backdrop-blur-md"
        style={{
          background:
            "linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(12,12,12,0.95) 100%)",
          boxShadow:
            "0 30px 70px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07), 0 1px 0 rgba(255,255,255,0.06) inset, 0 0 30px rgba(245,158,11,0.1)",
        }}
      >
        <span className="relative flex items-center">
          {isRecording ? (
            <>
              <span
                className="absolute inline-flex h-2.5 w-2.5 rounded-full animate-ping"
                style={{ background: "rgba(245,158,11,0.6)" }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{
                  background: "var(--color-amber-400)",
                  boxShadow: "0 0 10px rgba(245,158,11,0.9)",
                }}
              />
            </>
          ) : (
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{
                background: "var(--color-amber-400)",
                boxShadow: "0 0 12px var(--color-amber-400)",
                animation: "blink-cursor 1s step-end infinite",
              }}
            />
          )}
        </span>
        <div className="text-amber-300/95">
          <Waveform
            bars={24}
            height={22}
            width={2.5}
            gap={3}
            active={isRecording}
            color="currentColor"
          />
        </div>
        <span
          className="mono tabular-nums"
          style={{
            fontSize: 11,
            color: "rgba(245,239,230,0.85)",
            letterSpacing: 1,
          }}
        >
          {isRecording ? "00:04" : "Polishing · 0.4s"}
        </span>
        <span className="h-4 w-px bg-white/[0.15]" />
        <span className="flex items-center gap-1.5">
          <span className="keycap">⌃</span>
          <span className="keycap">Space</span>
        </span>
      </div>
    </motion.div>
  );
}

function TypedReveal({ text }: { text: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    let i = 0;
    const id = window.setInterval(() => {
      i++;
      setCount(i);
      if (i >= text.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, count)}
      {count < text.length && (
        <span
          aria-hidden
          className="inline-block animate-blink"
          style={{
            width: 2,
            height: "0.95em",
            background: "var(--color-amber-400)",
            verticalAlign: "middle",
            marginLeft: 2,
            boxShadow: "0 0 6px rgba(245,158,11,0.6)",
          }}
        />
      )}
    </span>
  );
}

function MobileStageCard({ step }: { step: number }) {
  return (
    <div className="relative w-full rounded-2xl border border-white/[0.07] bg-[#0a0a0a] p-8" style={{ minHeight: 180 }}>
      <span
        className="pointer-events-none absolute top-[-80px] left-1/2 -translate-x-1/2 h-[160px] w-[280px] rounded-full bg-amber-500/[0.07] blur-[80px]"
        aria-hidden
      />
      <div className="relative flex items-center justify-center">
        {step === 0 && (
          <div className="flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-2 backdrop-blur-md">
            <span className="keycap">⌃</span>
            <span className="text-stone-500">+</span>
            <span className="keycap">Space</span>
          </div>
        )}
        {step === 1 && <Pill mode="recording" />}
        {step === 2 && <Pill mode="polishing" />}
        {step === 3 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-1.5 mono text-[11px] tracking-[0.16em] uppercase text-emerald-300">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Pasted in place
          </span>
        )}
      </div>
    </div>
  );
}
