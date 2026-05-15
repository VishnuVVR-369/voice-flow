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

  // For SSR & reduced motion, render the polished string statically.
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
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full"
      style={{
        background: "var(--color-paper-soft)",
        minHeight: "clamp(320px, 50vw, 480px)",
      }}
      aria-hidden
    >
      <span className="rule absolute top-0 left-0 right-0" aria-hidden />
      <span className="rule absolute bottom-0 left-0 right-0" aria-hidden />

      {/* Top labels — left rail RAW/POLISHED + right caption */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between"
        style={{ padding: "20px clamp(20px, 4vw, 56px)" }}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={railLabel}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.32 }}
            className="mast"
            style={{
              color:
                railLabel === "RAW"
                  ? "var(--color-ink-muted)"
                  : "var(--color-coral)",
            }}
          >
            <span aria-hidden>{railLabel === "RAW" ? "→ " : "✦ "}</span>
            {railLabel}
          </motion.span>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.span
            key={phrase.id}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.32 }}
            className="mast"
            style={{ color: "var(--color-ink-muted)" }}
          >
            <span aria-hidden style={{ color: "var(--color-coral)" }}>
              ▸{" "}
            </span>
            {phrase.context.app} · {phrase.context.recipient}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Transcript */}
      <div
        className="relative flex items-center justify-center"
        style={{
          minHeight: "clamp(320px, 50vw, 480px)",
          padding:
            "clamp(64px, 10vw, 96px) clamp(20px, 6vw, 96px) clamp(60px, 8vw, 80px)",
        }}
      >
        <motion.p
          className="serif-italic relative w-full max-w-[1100px] mx-auto text-balance"
          style={{
            fontSize: "clamp(22px, 3.5vw, 42px)",
            lineHeight: 1.35,
            color: "var(--color-ink)",
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
                  className={t.isFiller ? "strike" : t.changed ? "diff-add" : ""}
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre",
                    color: t.isInsert
                      ? "var(--color-ink)"
                      : t.isFiller
                      ? "var(--color-ink-muted)"
                      : "var(--color-ink)",
                  }}
                >
                  {t.text}
                  {t.glue ? "" : " "}
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
                  background: "var(--color-ink)",
                  marginLeft: 2,
                  transform: "translateY(-0.05em)",
                }}
              />
            )}
          </LayoutGroup>
        </motion.p>

        {/* Coral underline sweep during morphing */}
        <AnimatePresence>
          {effectiveState.phase === "morphing" && (
            <motion.span
              key="sweep"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              className="absolute"
              aria-hidden
              style={{
                bottom: "clamp(40px, 5vw, 60px)",
                left: "clamp(20px, 6vw, 96px)",
                right: "clamp(20px, 6vw, 96px)",
                height: 2,
                background: "var(--color-coral)",
                transformOrigin: "left center",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom progress dots + spec strip */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between"
        style={{ padding: "20px clamp(20px, 4vw, 56px)" }}
      >
        <span
          className="mast"
          style={{ color: "var(--color-ink-faint)" }}
          aria-hidden
        >
          DICTATION {String(state.phraseIdx + 1).padStart(2, "0")} /{" "}
          {String(SCRIPT.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2.5" aria-hidden>
          {SCRIPT.map((_, i) => (
            <motion.span
              key={i}
              animate={{
                width: i === state.phraseIdx ? 18 : 6,
                background:
                  i === state.phraseIdx
                    ? "var(--color-coral)"
                    : "var(--color-ink-faint)",
              }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                height: 2,
                display: "block",
                borderRadius: 0,
              }}
            />
          ))}
        </div>
      </div>

      <p className="sr-only">
        Demonstration: voice transcripts being cleaned into polished text in
        real time.
      </p>
    </div>
  );
}
