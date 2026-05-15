"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { SCRIPT, type Phrase } from "@/lib/dictation-script";

type Phase = "typing" | "pause" | "morphing" | "settled" | "fading";

type State = {
  phraseIdx: number;
  phase: Phase;
  visibleRawCount: number;
};

const TYPE_INTERVAL = 130;
const PAUSE_MS = 1000;
const MORPH_MS = 1600;
const SETTLED_MS = 2400;
const FADE_MS = 500;
const REDUCED_HOLD_MS = 5500;

type Renderable = {
  key: string;
  text: string;
  isFiller: boolean;
  isInsert: boolean;
  changed: boolean;
  glue: boolean;
};

function renderableTokens(phrase: Phrase, state: State): Renderable[] {
  const out: Renderable[] = [];
  let rawIdx = 0;
  const isPolished =
    state.phase === "morphing" ||
    state.phase === "settled" ||
    state.phase === "fading";
  for (let i = 0; i < phrase.tokens.length; i++) {
    const t = phrase.tokens[i];
    const key = `${phrase.id}-${i}`;
    if (t.kind === "filler") {
      if (state.phase === "typing" && rawIdx < state.visibleRawCount) {
        out.push({
          key,
          text: t.text,
          isFiller: true,
          isInsert: false,
          changed: false,
          glue: !!t.glue,
        });
      } else if (state.phase === "pause") {
        out.push({
          key,
          text: t.text,
          isFiller: true,
          isInsert: false,
          changed: false,
          glue: !!t.glue,
        });
      }
      rawIdx++;
    } else if (t.kind === "keep") {
      const finalText = t.final ?? t.text;
      const changed = finalText !== t.text;
      if (isPolished) {
        out.push({
          key,
          text: finalText,
          isFiller: false,
          isInsert: false,
          changed,
          glue: !!t.glue,
        });
      } else if (state.phase === "pause") {
        out.push({
          key,
          text: t.text,
          isFiller: false,
          isInsert: false,
          changed: false,
          glue: !!t.glue,
        });
      } else if (state.phase === "typing" && rawIdx < state.visibleRawCount) {
        out.push({
          key,
          text: t.text,
          isFiller: false,
          isInsert: false,
          changed: false,
          glue: !!t.glue,
        });
      }
      rawIdx++;
    } else if (t.kind === "insert") {
      if (isPolished) {
        out.push({
          key,
          text: t.text,
          isFiller: false,
          isInsert: true,
          changed: false,
          glue: !!t.glue,
        });
      }
    }
  }
  return out;
}

export function Diff() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<State>({
    phraseIdx: 0,
    phase: "typing",
    visibleRawCount: 0,
  });
  const [paused, setPaused] = useState(false);
  const [offScreen, setOffScreen] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(
      (entries) => setOffScreen(!entries[0].isIntersecting),
      { threshold: 0.05 }
    );
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const blocked = paused || offScreen || tabHidden;

  useEffect(() => {
    if (!mounted) return;
    if (reduced) {
      const t = window.setTimeout(() => {
        setState((s) => ({
          phraseIdx: (s.phraseIdx + 1) % SCRIPT.length,
          phase: "settled",
          visibleRawCount: 0,
        }));
      }, REDUCED_HOLD_MS);
      return () => clearTimeout(t);
    }
    if (blocked) return;

    const phrase = SCRIPT[state.phraseIdx];
    const rawCount = phrase.tokens.filter((t) => t.kind !== "insert").length;

    let timer: number | undefined;
    if (state.phase === "typing") {
      if (state.visibleRawCount >= rawCount) {
        timer = window.setTimeout(
          () => setState((s) => ({ ...s, phase: "pause" })),
          120
        );
      } else {
        timer = window.setTimeout(
          () =>
            setState((s) => ({
              ...s,
              visibleRawCount: s.visibleRawCount + 1,
            })),
          TYPE_INTERVAL
        );
      }
    } else if (state.phase === "pause") {
      timer = window.setTimeout(
        () => setState((s) => ({ ...s, phase: "morphing" })),
        PAUSE_MS
      );
    } else if (state.phase === "morphing") {
      timer = window.setTimeout(
        () => setState((s) => ({ ...s, phase: "settled" })),
        MORPH_MS
      );
    } else if (state.phase === "settled") {
      timer = window.setTimeout(
        () => setState((s) => ({ ...s, phase: "fading" })),
        SETTLED_MS
      );
    } else if (state.phase === "fading") {
      timer = window.setTimeout(
        () =>
          setState((s) => ({
            phraseIdx: (s.phraseIdx + 1) % SCRIPT.length,
            phase: "typing",
            visibleRawCount: 0,
          })),
        FADE_MS
      );
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [state, blocked, mounted, reduced]);

  const phrase = SCRIPT[state.phraseIdx];

  const effectiveState: State =
    !mounted || reduced
      ? { phraseIdx: state.phraseIdx, phase: "settled", visibleRawCount: 0 }
      : state;

  const visible = useMemo(
    () => renderableTokens(phrase, effectiveState),
    [phrase, effectiveState]
  );

  const railLabel =
    effectiveState.phase === "typing" || effectiveState.phase === "pause"
      ? "RAW"
      : "POLISHED";

  const showCaret =
    effectiveState.phase === "typing" || effectiveState.phase === "pause";

  return (
    <div className="container-x">
      <div
        ref={containerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#111110]"
        style={{
          boxShadow:
            "0 60px 140px -30px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.04)",
          minHeight: "clamp(360px, 50vw, 520px)",
        }}
        aria-hidden
      >
        {/* Top hairline glow */}
        <span
          className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/45 to-transparent"
          aria-hidden
        />
        {/* Internal amber bloom (softest) */}
        <span
          className="pointer-events-none absolute top-[-180px] left-1/2 -translate-x-1/2 h-[380px] w-[700px] rounded-full bg-amber-500/[0.07] blur-[120px]"
          aria-hidden
        />
        {/* Faint grid floor */}
        <span
          className="pointer-events-none absolute inset-0 opacity-30 bg-gridlines"
          style={{ mask: "linear-gradient(180deg, black 0%, transparent 80%)" }}
          aria-hidden
        />

        {/* Top header */}
        <div className="relative flex items-center justify-between gap-3 px-6 py-4 border-b border-white/[0.05]">
          {/* Rail label + context */}
          <div className="flex items-center gap-4">
            <AnimatePresence mode="wait">
              <motion.span
                key={railLabel}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.32 }}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.16em] ${
                  railLabel === "RAW"
                    ? "border-white/10 bg-white/[0.03] text-stone-400"
                    : "border-amber-500/30 bg-amber-500/[0.08] text-amber-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    railLabel === "RAW" ? "bg-stone-500" : "bg-amber-400"
                  } ${railLabel === "POLISHED" ? "shadow-[0_0_10px_rgba(245,158,11,0.8)]" : ""}`}
                />
                {railLabel}
              </motion.span>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={phrase.id}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              transition={{ duration: 0.32 }}
              className="mono flex items-center gap-2 text-[11px] text-stone-500"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-400/70"
                aria-hidden
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-stone-300">{phrase.context.app}</span>
              <span className="text-stone-700">/</span>
              <span>{phrase.context.recipient}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Transcript stage */}
        <div
          className="relative flex items-center justify-center"
          style={{
            minHeight: "clamp(280px, 38vw, 380px)",
            padding:
              "clamp(40px, 6vw, 72px) clamp(20px, 6vw, 80px) clamp(40px, 6vw, 72px)",
          }}
        >
          <motion.p
            className="serif-italic relative w-full max-w-[1080px] mx-auto text-balance text-center"
            style={{
              fontSize: "clamp(22px, 3.4vw, 44px)",
              lineHeight: 1.35,
              color: "var(--color-stone-100)",
              letterSpacing: "-0.01em",
            }}
            animate={{
              opacity: effectiveState.phase === "fading" ? 0 : 1,
            }}
            transition={{ duration: 0.45 }}
          >
            <LayoutGroup id={phrase.id}>
              <AnimatePresence mode="popLayout">
                {visible.map((t) => (
                  <motion.span
                    key={t.key}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{
                      duration: t.isFiller ? 0.45 : 0.36,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={
                      t.isFiller
                        ? "strike"
                        : t.changed
                        ? "diff-add"
                        : t.isInsert
                        ? "text-amber-200"
                        : ""
                    }
                    style={{
                      display: "inline-block",
                      whiteSpace: "pre",
                    }}
                  >
                    {t.text}
                    {t.glue ? "" : " "}
                  </motion.span>
                ))}
              </AnimatePresence>
              {showCaret && (
                <motion.span
                  layout
                  aria-hidden
                  className="animate-blink inline-block align-middle"
                  style={{
                    width: 2,
                    height: "0.9em",
                    background: "var(--color-amber-400)",
                    marginLeft: 2,
                    transform: "translateY(-0.05em)",
                    boxShadow: "0 0 8px rgba(245,158,11,0.6)",
                  }}
                />
              )}
            </LayoutGroup>
          </motion.p>

          {/* Amber underline sweep during morphing */}
          <AnimatePresence>
            {effectiveState.phase === "morphing" && (
              <motion.span
                key="sweep"
                initial={{ scaleX: 0, opacity: 0.9 }}
                animate={{ scaleX: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                className="absolute"
                aria-hidden
                style={{
                  bottom: "clamp(30px, 4.5vw, 56px)",
                  left: "clamp(20px, 6vw, 80px)",
                  right: "clamp(20px, 6vw, 80px)",
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent 0%, var(--color-amber-400) 50%, transparent 100%)",
                  transformOrigin: "left center",
                  boxShadow: "0 0 12px rgba(245,158,11,0.6)",
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer — progress dots */}
        <div className="relative flex items-center justify-between gap-3 border-t border-white/[0.05] px-6 py-4">
          <span className="mono text-[10.5px] uppercase tracking-[0.16em] text-stone-600">
            DICTATION {String(state.phraseIdx + 1).padStart(2, "0")} /{" "}
            {String(SCRIPT.length).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2.5" aria-hidden>
            {SCRIPT.map((_, i) => (
              <motion.span
                key={i}
                animate={{
                  width: i === state.phraseIdx ? 22 : 6,
                  background:
                    i === state.phraseIdx
                      ? "rgba(245, 158, 11, 1)"
                      : "rgba(255,255,255,0.18)",
                  boxShadow:
                    i === state.phraseIdx
                      ? "0 0 10px rgba(245,158,11,0.7)"
                      : "none",
                }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: 4,
                  display: "block",
                  borderRadius: 999,
                }}
              />
            ))}
          </div>
          <span className="mono hidden sm:inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-stone-600">
            <span className="inline-block h-1 w-1 rounded-full bg-emerald-400/70" />
            Live demo
          </span>
        </div>

        <p className="sr-only">
          Demonstration: voice transcripts being cleaned into polished text in
          real time.
        </p>
      </div>
    </div>
  );
}
