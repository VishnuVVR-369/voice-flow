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
    spec: "Whisper-large-v3 · 240 ms first token",
  },
  {
    n: "03",
    label: "POLISH",
    title: "We clean the rough edges.",
    body:
      "A second pass through an LLM strips filler, fixes punctuation, capitalizes proper nouns, and reformats lists, code identifiers, and email greetings — informed by the app you're typing into.",
    spec: "App-aware · ~400 ms",
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
  },
  {
    label: "Two modes",
    body:
      "Toggle for long thoughts. Hold for quick zaps. Two shortcuts, one muscle memory.",
  },
  {
    label: "Local history",
    body:
      "Every dictation saved to your Mac as plain JSON. Searchable. Deletable. Yours.",
  },
  {
    label: "Whisper-large-v3",
    body:
      "English by default. Auto-detect across 90+ languages — including code-mixed speech.",
  },
];

export function Demo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const stepValue = useTransform(scrollYProgress, [0.05, 0.32, 0.58, 0.84], [
    0, 1, 2, 3,
  ]);

  useMotionValueEvent(stepValue, "change", (v) => {
    const next = Math.min(3, Math.max(0, Math.round(v)));
    setStep(next);
  });

  return (
    <section
      id="demo"
      ref={sectionRef}
      className="relative"
      style={{ background: "var(--color-paper)" }}
    >
      {/* Section header */}
      <div className="container-x pt-[clamp(96px,14vw,200px)]">
        <EditorialMast>WORKFLOW · LIVE</EditorialMast>
        <div className="mt-8 grid-editorial">
          <h2
            className="headline-md col-span-12 md:col-span-7"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}
          >
            Five seconds.
            <br />
            <span className="serif-italic italic-lig">
              Four moves, executed.
            </span>
          </h2>
          <p
            className="body-prose mt-6 md:mt-0 md:col-start-9 md:col-span-4 self-end"
            style={{ maxWidth: "44ch" }}
          >
            A complete dictation is four discrete beats — trigger, capture,
            polish, paste — each tuned to disappear into your attention.
            Scroll to watch each one move.
          </p>
        </div>
        <span className="rule mt-12" aria-hidden />
      </div>

      {/* Scroll-driven narrative */}
      <div className="container-x mt-10">
        <div className="grid-editorial relative">
          {/* Left column: 4 beats */}
          <div className="col-span-12 md:col-span-6 lg:col-span-5">
            {BEATS.map((b, i) => (
              <BeatBlock key={b.n} beat={b} index={i} activeIndex={step} />
            ))}
          </div>

          {/* Right column: sticky stage */}
          <div className="hidden md:block md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
            <div
              className="sticky"
              style={{
                top: "18vh",
                height: "64vh",
              }}
            >
              <Stage step={step} />
            </div>
          </div>
        </div>
      </div>

      {/* Pull quote */}
      <div className="container-x mt-[clamp(80px,10vw,140px)]">
        <span className="rule-fade" aria-hidden />
        <div className="grid-editorial mt-12">
          <blockquote
            className="hang-quote col-span-12 md:col-start-2 md:col-span-10 text-balance"
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontStyle: "italic",
              fontSize: "clamp(28px, 4.5vw, 56px)",
              lineHeight: 1.18,
              letterSpacing: "-0.018em",
              color: "var(--color-ink)",
              fontVariationSettings: '"SOFT" 60, "opsz" 80',
            }}
          >
            <span style={{ color: "var(--color-coral)" }}>“</span>
            Five seconds. Zero context switches.{" "}
            <span style={{ color: "var(--color-coral)" }}>
              The keyboard generation finally got an interface.
            </span>
            <span style={{ color: "var(--color-coral)" }}>”</span>
          </blockquote>
        </div>
        <span className="rule-fade mt-12" aria-hidden />
      </div>

      {/* Footnote-style details coda */}
      <div className="container-x mt-[clamp(60px,8vw,100px)] pb-[clamp(60px,8vw,120px)]">
        <EditorialMast>FOOTNOTES</EditorialMast>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
          {FOOTNOTES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <div
                className="mast"
                style={{ color: "var(--color-coral)" }}
              >
                №{String(i + 1).padStart(2, "0")} · {f.label}
              </div>
              <p
                className="mt-3"
                style={{
                  fontFamily: "var(--font-fraunces)",
                  fontStyle: "italic",
                  fontSize: 18,
                  lineHeight: 1.45,
                  letterSpacing: "-0.01em",
                  color: "var(--color-ink)",
                  fontVariationSettings: '"SOFT" 30, "opsz" 24',
                }}
              >
                {f.body}
              </p>
            </motion.div>
          ))}
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
        animate={{
          opacity: isActive ? 1 : 0.32,
        }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {/* Coral active marker */}
        <motion.span
          aria-hidden
          className="absolute"
          animate={{
            opacity: isActive ? 1 : 0,
            scaleY: isActive ? 1 : 0.4,
          }}
          transition={{ duration: 0.4 }}
          style={{
            left: "calc(-1 * clamp(20px, 3vw, 40px))",
            top: "0.15em",
            bottom: "0.15em",
            width: 3,
            background: "var(--color-coral)",
            transformOrigin: "center",
          }}
        />

        <div
          className="mast flex items-center gap-3"
          style={{ color: "var(--color-coral)" }}
        >
          <span
            className="numeral"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: 13,
              fontWeight: 400,
            }}
          >
            {beat.n}
          </span>
          <span style={{ color: "var(--color-ink-faint)" }}>/</span>
          <span>{beat.label}</span>
        </div>

        <h3
          className="mt-5 text-balance"
          style={{
            fontFamily: "var(--font-fraunces)",
            fontSize: "clamp(28px, 3.5vw, 44px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
            fontVariationSettings: '"SOFT" 35, "opsz" 60',
          }}
        >
          {beat.title}
        </h3>

        <p className="mt-5 body-prose" style={{ maxWidth: "52ch" }}>
          {beat.body}
        </p>

        <div
          className="mt-6 mast"
          style={{ color: "var(--color-ink-muted)" }}
        >
          <span style={{ color: "var(--color-coral)" }}>▸ </span>
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
      className="relative h-full w-full overflow-hidden"
      style={{
        background: "var(--color-paper-soft)",
        border: "1px solid var(--color-ink-faint)",
        borderRadius: 6,
      }}
    >
      {/* Stage header */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-ink-faint)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="win-dot" style={{ background: "#ff5f57" }} />
          <span className="win-dot" style={{ background: "#febc2e" }} />
          <span className="win-dot" style={{ background: "#28c840" }} />
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={step}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.3 }}
            className="mast"
            style={{ color: "var(--color-ink-muted)" }}
          >
            #eng — Slack
          </motion.span>
        </AnimatePresence>
        <span
          className="mast"
          style={{ color: "var(--color-ink-faint)" }}
        >
          {String(step + 1).padStart(2, "0")} / 04
        </span>
      </div>

      {/* Stage body */}
      <div
        className="relative flex flex-col"
        style={{ height: "calc(100% - 53px)" }}
      >
        {/* Chat area */}
        <div
          className="flex-1 overflow-hidden"
          style={{ padding: "28px 24px 0" }}
        >
          {/* Previous message (always visible context) */}
          <div className="flex items-start gap-3 mb-5 opacity-60">
            <span
              className="inline-block flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: "var(--color-ink-faint)",
              }}
            />
            <div>
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-muted)",
                  letterSpacing: 0.5,
                }}
              >
                alex · 2:14 PM
              </div>
              <p
                className="mt-1"
                style={{
                  fontSize: 14,
                  color: "var(--color-ink-soft)",
                  lineHeight: 1.5,
                }}
              >
                any update on the auth fix timeline?
              </p>
            </div>
          </div>

          {/* User message — fills in during step 4 */}
          <div className="flex items-start gap-3">
            <span
              className="inline-block flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: "var(--color-ink)",
              }}
            />
            <div className="flex-1">
              <div
                className="mono"
                style={{
                  fontSize: 11,
                  color: "var(--color-ink-muted)",
                  letterSpacing: 0.5,
                }}
              >
                you · just now
              </div>
              <AnimatePresence mode="wait">
                {step === 3 ? (
                  <motion.p
                    key="pasted"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-1"
                    style={{
                      fontSize: 14,
                      color: "var(--color-ink)",
                      lineHeight: 1.5,
                    }}
                  >
                    <TypedReveal text="We should ship the auth fix on Tuesday. Also — can you let the team know about the meeting on Friday?" />
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1 mono"
                    style={{
                      fontSize: 13,
                      color: "var(--color-ink-faint)",
                    }}
                  >
                    <span aria-hidden>│</span>{" "}
                    <span className="italic">
                      {step === 0
                        ? "type a message…"
                        : step === 1
                        ? "listening…"
                        : "polishing…"}
                    </span>
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
                className="flex items-center gap-2.5"
              >
                <span className="keycap">⌃</span>
                <span style={{ color: "var(--color-ink-muted)" }}>+</span>
                <span className="keycap">Space</span>
                <span
                  className="mast ml-2"
                  style={{ color: "var(--color-ink-muted)" }}
                >
                  to dictate
                </span>
              </motion.div>
            )}
            {step === 1 && <Pill key="capture" mode="recording" />}
            {step === 2 && <Pill key="polish" mode="polishing" />}
            {step === 3 && (
              <motion.span
                key="pasted-mark"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="mast"
                style={{ color: "var(--color-coral)" }}
              >
                <span aria-hidden>✓ </span>pasted in place
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
      className="relative inline-flex items-center gap-3 rounded-full px-4 py-2.5"
      style={{
        background: "var(--color-ink)",
        boxShadow:
          "0 30px 60px -25px rgba(20,18,16,0.5), 0 0 0 1px rgba(20,18,16,0.08)",
      }}
    >
      <span className="relative flex items-center">
        {isRecording ? (
          <>
            <span
              className="absolute inline-flex h-2.5 w-2.5 rounded-full animate-ping"
              style={{ background: "rgba(224,74,43,0.6)" }}
            />
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: "var(--color-coral)" }}
            />
          </>
        ) : (
          <span
            className="relative inline-flex h-2.5 w-2.5 rounded-full"
            style={{
              background: "var(--color-coral)",
              boxShadow: "0 0 10px var(--color-coral)",
              animation: "blink-cursor 1s step-end infinite",
            }}
          />
        )}
      </span>
      <div style={{ color: "var(--color-paper)" }}>
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
      <span
        className="h-4 w-px"
        style={{ background: "rgba(245,239,230,0.18)" }}
      />
      <span className="flex items-center gap-1.5">
        <span
          className="inline-flex items-center justify-center"
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 10,
            padding: "3px 6px",
            minWidth: 22,
            height: 20,
            borderRadius: 3,
            background: "rgba(245,239,230,0.08)",
            border: "1px solid rgba(245,239,230,0.18)",
            color: "rgba(245,239,230,0.85)",
          }}
        >
          ⌃
        </span>
        <span
          className="inline-flex items-center justify-center"
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 10,
            padding: "3px 6px",
            minWidth: 22,
            height: 20,
            borderRadius: 3,
            background: "rgba(245,239,230,0.08)",
            border: "1px solid rgba(245,239,230,0.18)",
            color: "rgba(245,239,230,0.85)",
          }}
        >
          Space
        </span>
      </span>
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
            background: "var(--color-ink)",
            verticalAlign: "middle",
            marginLeft: 2,
          }}
        />
      )}
    </span>
  );
}

function MobileStageCard({ step }: { step: number }) {
  return (
    <div
      className="relative w-full"
      style={{
        background: "var(--color-paper-soft)",
        border: "1px solid var(--color-ink-faint)",
        borderRadius: 6,
        padding: "32px 20px",
        minHeight: 180,
      }}
    >
      <div className="flex items-center justify-center">
        {step === 0 && (
          <div className="flex items-center gap-2.5">
            <span className="keycap">⌃</span>
            <span style={{ color: "var(--color-ink-muted)" }}>+</span>
            <span className="keycap">Space</span>
          </div>
        )}
        {step === 1 && <Pill mode="recording" />}
        {step === 2 && <Pill mode="polishing" />}
        {step === 3 && (
          <span
            className="mast"
            style={{ color: "var(--color-coral)" }}
          >
            <span aria-hidden>✓ </span>pasted in place
          </span>
        )}
      </div>
    </div>
  );
}
