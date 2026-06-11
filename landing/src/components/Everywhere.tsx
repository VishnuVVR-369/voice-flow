"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { EditorialMast } from "./EditorialMast";
import { Waveform } from "./Waveform";
import { SCRIPT, type Phrase } from "@/lib/dictation-script";

/* ── Scroll choreography ──────────────────────────────────
   The wrapper is APPS.length × SEGMENT_VH tall; the stage is
   sticky inside it. Each app owns one equal segment of scroll.
   Within a segment, local progress maps to dictation phases:

     0 ──────────── TYPE_END   raw words scrub in, one per tick
     TYPE_END ───── PAUSE_END  full raw transcript holds
     PAUSE_END ──── MORPH_END  fillers collapse, fixes morph in
     MORPH_END ──── 1          polished text settles, "pasted"

   Scrubbing is fully reversible — scroll up and the polish
   un-applies, the words un-type.                            */
const TYPE_END = 0.52;
const PAUSE_END = 0.6;
const MORPH_END = 0.74;
const SEGMENT_VH = 110;

type Phase = "idle" | "typing" | "pause" | "morphing" | "settled";

type StageState = {
  appIdx: number;
  phase: Phase;
  visibleRawCount: number;
};

type AppDef = {
  id: string;
  name: string;
  window: string;
  icon: (props: { className?: string }) => ReactNode;
};

/* Order matches SCRIPT: auth-fix, standup, pr-review, email-reply */
const APPS: AppDef[] = [
  { id: "slack", name: "Slack", window: "#eng — Slack", icon: SlackIcon },
  { id: "linear", name: "Linear", window: "VOI-128 — Linear", icon: LinearIcon },
  { id: "github", name: "GitHub", window: "PR #482 — GitHub", icon: GitHubIcon },
  { id: "mail", name: "Mail", window: "Re: Q3 review — Mail", icon: MailIcon },
];

const MORE_APPS = ["Cursor", "Notion", "Figma", "Terminal", "Discord", "Obsidian", "Chrome"];

type Renderable = {
  key: string;
  text: string;
  isFiller: boolean;
  isInsert: boolean;
  changed: boolean;
  glue: boolean;
};

const ATTACHING_PUNCT = /^[.,;:!?]$/;

function tokensFor(
  phrase: Phrase,
  phase: Phase,
  visibleRawCount: number
): Renderable[] {
  const out: Renderable[] = [];
  let rawIdx = 0;
  const polished = phase === "morphing" || phase === "settled";
  for (let i = 0; i < phrase.tokens.length; i++) {
    const t = phrase.tokens[i];
    const key = `${phrase.id}-${i}`;
    const rawVisible =
      phase === "pause" || (phase === "typing" && rawIdx < visibleRawCount);
    if (t.kind === "filler") {
      if (rawVisible) {
        out.push({ key, text: t.text, isFiller: true, isInsert: false, changed: false, glue: false });
      }
      rawIdx++;
    } else if (t.kind === "keep") {
      const finalText = t.final ?? t.text;
      if (polished) {
        out.push({ key, text: finalText, isFiller: false, isInsert: false, changed: finalText !== t.text, glue: false });
      } else if (rawVisible) {
        out.push({ key, text: t.text, isFiller: false, isInsert: false, changed: false, glue: false });
      }
      rawIdx++;
    } else if (polished) {
      out.push({ key, text: t.text, isFiller: false, isInsert: true, changed: false, glue: false });
    }
  }
  // Attach punctuation inserts to the preceding word (no space before "." etc.)
  for (let i = 1; i < out.length; i++) {
    if (out[i].isInsert && ATTACHING_PUNCT.test(out[i].text)) {
      out[i - 1].glue = true;
    }
  }
  if (out.length) out[out.length - 1].glue = true;
  return out;
}

export function Everywhere() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [state, setState] = useState<StageState>({
    appIdx: 0,
    phase: "idle",
    visibleRawCount: 0,
  });

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const n = APPS.length;
    const x = Math.min(0.9999, Math.max(0, v));
    const idx = Math.min(n - 1, Math.floor(x * n));
    const local = x * n - idx;
    const phrase = SCRIPT[idx];
    const rawCount = phrase.tokens.filter((t) => t.kind !== "insert").length;

    let phase: Phase;
    let count = 0;
    if (v <= 0.0001) {
      phase = "idle";
    } else if (local < TYPE_END) {
      phase = "typing";
      count = Math.max(1, Math.min(rawCount, Math.ceil((local / TYPE_END) * rawCount)));
    } else if (local < PAUSE_END) {
      phase = "pause";
    } else if (local < MORPH_END) {
      phase = "morphing";
    } else {
      phase = "settled";
    }

    setState((prev) =>
      prev.appIdx === idx && prev.phase === phase && prev.visibleRawCount === count
        ? prev
        : { appIdx: idx, phase, visibleRawCount: count }
    );
  });

  const scrollToApp = (i: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const top = window.scrollY + el.getBoundingClientRect().top;
    const scrollable = el.offsetHeight - window.innerHeight;
    // Land deep enough into the segment that the polished text shows.
    window.scrollTo({
      top: top + ((i + 0.85) / APPS.length) * scrollable,
      behavior: "smooth",
    });
  };

  const phase: Phase = reduced ? "settled" : state.phase;
  const app = APPS[state.appIdx];
  const phrase = SCRIPT[state.appIdx];

  return (
    <section id="everywhere" className="relative section" style={{ paddingBottom: 0 }}>
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
              <EditorialMast variant="chip">WORKS EVERYWHERE</EditorialMast>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              className="headline-md mt-6 text-balance"
              style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
            >
              One voice.{" "}
              <span className="serif-italic text-grad-amber amber-glow">
                Every app.
              </span>
            </motion.h2>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="body-prose col-span-12 md:col-span-5 self-end mt-4 md:mt-0"
            style={{ maxWidth: "46ch" }}
          >
            VoiceFlow pastes through the macOS Accessibility API, so polished
            text lands wherever your caret is — no plugins, no integrations to
            install. Scroll to watch one dictation travel through your stack.
          </motion.p>
        </div>
      </div>

      {/* Scroll-scrubbed stage */}
      <div
        ref={wrapRef}
        className="relative"
        style={{ height: `${APPS.length * SEGMENT_VH}vh` }}
      >
        <div className="sticky top-0 flex h-svh items-center">
          <div className="container-x w-full">
            <div className="mx-auto w-full max-w-[920px]" aria-hidden>
              {/* App tabs with scroll progress */}
              <div className="mb-4 grid grid-cols-4 gap-2">
                {APPS.map((a, i) => (
                  <AppTab
                    key={a.id}
                    app={a}
                    index={i}
                    active={i === state.appIdx}
                    progress={scrollYProgress}
                    onClick={() => scrollToApp(i)}
                  />
                ))}
              </div>

              {/* The window */}
              <div
                className="relative overflow-hidden rounded-2xl border border-white/[0.07]"
                style={{
                  background: "linear-gradient(180deg, #0b0b0a 0%, #050505 100%)",
                  boxShadow:
                    "0 60px 140px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/35 to-transparent" />
                <span className="pointer-events-none absolute top-[-150px] left-1/2 h-[300px] w-[560px] -translate-x-1/2 rounded-full bg-amber-500/[0.06] blur-[100px]" />

                {/* Window chrome */}
                <div className="relative flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="win-dot" style={{ background: "#4b4845" }} />
                    <span className="win-dot" style={{ background: "#4b4845" }} />
                    <span className="win-dot" style={{ background: "#4b4845" }} />
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={app.id}
                      initial={{ opacity: 0, y: -3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 3 }}
                      transition={{ duration: 0.25 }}
                      className="mono rounded-md bg-white/[0.04] px-3 py-1 text-[11px] tracking-wider text-stone-500"
                    >
                      {app.window}
                    </motion.span>
                  </AnimatePresence>
                  <span className="mono text-[10.5px] uppercase tracking-[0.18em] text-stone-600">
                    {String(state.appIdx + 1).padStart(2, "0")} / {String(APPS.length).padStart(2, "0")}
                  </span>
                </div>

                {/* App body */}
                <div className="relative" style={{ height: "clamp(340px, 52svh, 440px)" }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -16 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full"
                    >
                      <AppFrame
                        appId={app.id}
                        live={phase === "typing" || phase === "pause" || phase === "morphing"}
                      >
                        <DictationText
                          phrase={phrase}
                          phase={phase}
                          visibleRawCount={state.visibleRawCount}
                        />
                      </AppFrame>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* The floating overlay pill — the real product UI */}
              <StatusPill phase={phase} />
            </div>
          </div>
          <p className="sr-only">
            Demonstration: as you scroll, a spoken transcript is typed, cleaned
            of filler words, and pasted as polished text inside Slack, Linear,
            GitHub, and Mail.
          </p>
        </div>
      </div>

      {/* And everywhere else */}
      <div className="container-x pb-[clamp(60px,8vw,100px)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          <span className="mast">…and everywhere else</span>
          {MORE_APPS.map((name, i) => (
            <span
              key={name}
              className="cursor-default rounded-full border border-white/[0.06] bg-white/[0.025] px-3 py-1 text-[11.5px] text-stone-300 backdrop-blur-md transition-colors hover:border-amber-500/40 hover:bg-amber-500/[0.06] hover:text-amber-200"
              style={{
                animation: "float-y 6s ease-in-out infinite",
                animationDelay: `${-i * 0.7}s`,
              }}
            >
              {name}
            </span>
          ))}
          <span className="mast">— anywhere a cursor blinks.</span>
        </motion.div>
      </div>
    </section>
  );
}

/* ── App tab with scroll-fill underline ──────────────────── */
function AppTab({
  app,
  index,
  active,
  progress,
  onClick,
}: {
  app: AppDef;
  index: number;
  active: boolean;
  progress: MotionValue<number>;
  onClick: () => void;
}) {
  const Icon = app.icon;
  const fill = useTransform(progress, (v) => {
    const local = Math.min(1, Math.max(0, v * APPS.length - index));
    return `${local * 100}%`;
  });
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors duration-300 ${
        active
          ? "border-amber-500/30 bg-amber-500/[0.06]"
          : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.03]"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon
          className={`h-3.5 w-3.5 transition-colors duration-300 ${
            active ? "text-amber-300" : "text-stone-500 group-hover:text-stone-300"
          }`}
        />
        <span
          className={`text-[12px] font-medium transition-colors duration-300 ${
            active ? "text-amber-200" : "text-stone-400 group-hover:text-stone-200"
          }`}
        >
          {app.name}
        </span>
      </span>
      <span className="relative block h-[2px] w-full overflow-hidden rounded-full bg-white/[0.06]">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: fill,
            background:
              "linear-gradient(90deg, var(--color-amber-400), var(--color-orange-400))",
            boxShadow: "0 0 8px rgba(245,158,11,0.5)",
          }}
        />
      </span>
    </button>
  );
}

/* ── The morphing dictation text ─────────────────────────── */
function DictationText({
  phrase,
  phase,
  visibleRawCount,
}: {
  phrase: Phrase;
  phase: Phase;
  visibleRawCount: number;
}) {
  const visible = useMemo(
    () => tokensFor(phrase, phase, visibleRawCount),
    [phrase, phase, visibleRawCount]
  );
  const showCaret = phase === "typing" || phase === "pause";

  return (
    <div
      className="relative w-full text-left"
      style={{
        fontSize: "clamp(14px, 1.5vw, 16.5px)",
        lineHeight: 1.7,
        minHeight: "5.1em",
        letterSpacing: "-0.005em",
      }}
    >
      {phase === "idle" ? (
        <span className="italic text-stone-600">
          Press <span className="keycap not-italic">⌃</span>{" "}
          <span className="keycap not-italic">Space</span> and just talk…
        </span>
      ) : (
        <LayoutGroup id={phrase.id}>
          <AnimatePresence mode="popLayout">
            {visible.map((t) => (
              <TokenSpan key={t.key} t={t} />
            ))}
          </AnimatePresence>
          {showCaret && (
            <motion.span
              layout
              aria-hidden
              className="animate-blink inline-block align-middle"
              style={{
                width: 2,
                height: "0.95em",
                background: "var(--color-amber-400)",
                marginLeft: 2,
                transform: "translateY(-0.05em)",
                boxShadow: "0 0 8px rgba(245,158,11,0.6)",
              }}
            />
          )}
        </LayoutGroup>
      )}
    </div>
  );
}

function TokenSpan({ t }: { t: Renderable }) {
  const isCode = /^`[^`]+`$/.test(t.text);
  const content = isCode ? t.text.slice(1, -1) : t.text;
  return (
    <motion.span
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: t.isFiller ? 0.4 : 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={
        t.isFiller
          ? "strike"
          : t.isInsert
          ? "text-amber-200"
          : t.changed && !isCode
          ? "diff-add text-stone-100"
          : "text-stone-200"
      }
      style={{ display: "inline-block", whiteSpace: "pre" }}
    >
      {isCode ? (
        <code className="mono rounded border border-amber-500/20 bg-amber-500/[0.08] px-1 py-px text-[0.88em] text-amber-200">
          {content}
        </code>
      ) : (
        content
      )}
      {t.glue ? "" : " "}
    </motion.span>
  );
}

/* ── Floating overlay pill, synced to phase ──────────────── */
function StatusPill({ phase }: { phase: Phase }) {
  return (
    <div className="mt-6 flex h-[56px] items-start justify-center">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-4 py-2 backdrop-blur-md"
          >
            <span className="keycap">⌃</span>
            <span className="text-stone-500">+</span>
            <span className="keycap">Space</span>
            <span className="mast ml-1.5">scroll to dictate</span>
          </motion.div>
        )}
        {(phase === "typing" || phase === "pause") && (
          <RecordingPill key="rec" mode="recording" />
        )}
        {phase === "morphing" && <RecordingPill key="polish" mode="polishing" />}
        {phase === "settled" && (
          <motion.span
            key="done"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className="mono inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-emerald-300"
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
  );
}

function RecordingPill({ mode }: { mode: "recording" | "polishing" }) {
  const isRecording = mode === "recording";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
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
                className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full"
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
          <Waveform bars={24} height={22} width={2.5} gap={3} active={isRecording} color="currentColor" />
        </div>
        <span
          className="mono tabular-nums"
          style={{ fontSize: 11, color: "rgba(245,239,230,0.85)", letterSpacing: 1 }}
        >
          {isRecording ? "Listening" : "Polishing"}
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

/* ── Per-app frames ──────────────────────────────────────── */
function AppFrame({
  appId,
  live,
  children,
}: {
  appId: string;
  live: boolean;
  children: ReactNode;
}) {
  switch (appId) {
    case "slack":
      return <SlackFrame live={live}>{children}</SlackFrame>;
    case "linear":
      return <LinearFrame live={live}>{children}</LinearFrame>;
    case "github":
      return <GitHubFrame live={live}>{children}</GitHubFrame>;
    default:
      return <MailFrame live={live}>{children}</MailFrame>;
  }
}

function composerClasses(live: boolean) {
  return `rounded-xl border px-4 pb-3 pt-3.5 transition-all duration-300 ${
    live
      ? "border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_30px_rgba(245,158,11,0.07)]"
      : "border-white/[0.08] bg-white/[0.02]"
  }`;
}

function ComposerToolbar({
  action,
  tone = "amber",
}: {
  action: string;
  tone?: "amber" | "emerald";
}) {
  return (
    <div className="mt-3 flex items-center justify-between">
      <div className="flex items-center gap-3 text-stone-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-3.5 w-3.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span className="text-[11px] font-semibold tracking-tight">Aa</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <rect x="9" y="2" width="6" height="12" rx="3" />
          <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
        </svg>
      </div>
      <span
        className={`rounded-md px-3 py-1 text-[11px] font-semibold ${
          tone === "emerald"
            ? "bg-emerald-600/80 text-emerald-50"
            : "bg-amber-500/90 text-black"
        }`}
      >
        {action}
      </span>
    </div>
  );
}

function ChatMessage({
  initial,
  name,
  time,
  children,
}: {
  initial: string;
  name: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 opacity-65">
      <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-stone-700/80 text-[10px] font-semibold text-stone-300">
        {initial}
      </span>
      <div>
        <div className="mono text-[11px] tracking-wider text-stone-500">
          {name} · {time}
        </div>
        <p className="mt-1 text-[13.5px] leading-relaxed text-stone-400">{children}</p>
      </div>
    </div>
  );
}

function SlackFrame({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-2.5">
        <span className="text-[14px] font-bold text-stone-300"># eng</span>
        <span className="mono text-[10px] text-stone-600">42 members</span>
        <SlackIcon className="ml-auto h-3.5 w-3.5 text-stone-600" />
      </div>
      <div className="flex-1 space-y-4 overflow-hidden px-5 py-4">
        <ChatMessage initial="A" name="alex" time="2:14 PM">
          any update on the auth fix timeline?
        </ChatMessage>
      </div>
      <div className="px-5 pb-5">
        <div className={composerClasses(live)}>
          {children}
          <ComposerToolbar action="Send" />
        </div>
      </div>
    </div>
  );
}

function LinearFrame({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-white/[0.04] px-5 py-2.5">
        <LinearIcon className="h-3.5 w-3.5 text-stone-500" />
        <span className="mono text-[11px] tracking-wider text-stone-500">VOI-128</span>
        <span className="text-[13px] font-semibold text-stone-300">Daily standup — Jun 11</span>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.02] px-2.5 py-0.5 text-[10.5px] text-stone-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
          In Progress
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-hidden px-5 py-4">
        <p className="mast">Activity</p>
        <p className="text-[12.5px] text-stone-500">
          <span className="text-stone-400">priya</span> moved this to{" "}
          <span className="text-stone-300">In Progress</span> · yesterday
        </p>
      </div>
      <div className="px-5 pb-5">
        <div className={composerClasses(live)}>
          {children}
          <ComposerToolbar action="Comment" />
        </div>
      </div>
    </div>
  );
}

function GitHubFrame({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.04] px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <GitHubIcon className="h-3.5 w-3.5 text-stone-500" />
          <span className="text-[13px] font-semibold text-stone-300">
            fix: session hydration race
            <span className="ml-1.5 font-normal text-stone-500">#482</span>
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.08] px-2.5 py-0.5 text-[10.5px] font-medium text-emerald-300">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden>
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
              <path fillRule="evenodd" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0z" />
            </svg>
            Open
          </span>
        </div>
        <div className="mono mt-2 flex items-center gap-4 text-[10.5px] tracking-wider text-stone-600">
          <span className="border-b border-amber-500/60 pb-1 text-stone-300">Conversation</span>
          <span className="pb-1">Files changed · 3</span>
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-hidden px-5 py-4">
        <ChatMessage initial="M" name="maya" time="reviewed 1h ago">
          this still breaks when the session is empty, right?
        </ChatMessage>
      </div>
      <div className="px-5 pb-5">
        <div className={composerClasses(live)}>
          {children}
          <ComposerToolbar action="Comment" tone="emerald" />
        </div>
      </div>
    </div>
  );
}

function MailFrame({ live, children }: { live: boolean; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.04] px-5 py-2">
        <div className="flex items-center gap-2 border-b border-white/[0.04] py-1.5">
          <span className="mono w-14 text-[10.5px] uppercase tracking-wider text-stone-600">To</span>
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-0.5 text-[11.5px] text-stone-300">
            alex@acme.com
          </span>
        </div>
        <div className="flex items-center gap-2 py-1.5">
          <span className="mono w-14 text-[10.5px] uppercase tracking-wider text-stone-600">Subject</span>
          <span className="text-[12.5px] font-medium text-stone-300">Re: Q3 review</span>
          <MailIcon className="ml-auto h-3.5 w-3.5 text-stone-600" />
        </div>
      </div>
      <div className="flex-1 px-5 py-4">
        <div
          className={`h-full rounded-xl border px-4 py-3.5 transition-all duration-300 ${
            live
              ? "border-amber-500/30 bg-amber-500/[0.03] shadow-[0_0_30px_rgba(245,158,11,0.07)]"
              : "border-white/[0.08] bg-white/[0.02]"
          }`}
        >
          {children}
        </div>
      </div>
      <div className="flex items-center justify-between px-5 pb-5">
        <span className="rounded-md bg-amber-500/90 px-3.5 py-1.5 text-[11px] font-semibold text-black">
          Send
        </span>
        <span className="mono text-[10px] uppercase tracking-[0.16em] text-stone-600">
          Draft saved
        </span>
      </div>
    </div>
  );
}

/* ── App icons (monochrome, currentColor) ────────────────── */
function SlackIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

function LinearIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.886 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.246-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.28-2.195.313L.009 11.358a12.01 12.01 0 0 1 .313-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z" />
    </svg>
  );
}

function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.88-1.36-3.88-1.36-.53-1.35-1.29-1.71-1.29-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.41-1.27.74-1.56-2.55-.29-5.24-1.27-5.24-5.67 0-1.25.45-2.27 1.18-3.08-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.24 2.74.12 3.03.74.81 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.42.36.79 1.08.79 2.18v3.23c0 .31.21.67.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

function MailIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}
