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
  },
  {
    n: "02",
    label: "BRING YOUR OWN KEY",
    title: "You pay Groq directly. We pay nothing.",
    body:
      "VoiceFlow uses your Groq API key for transcription and polish. No middleman, no markup, no per-minute pricing. Cost-per-dictation is typically a fraction of a cent — and the bill arrives in your inbox, not ours.",
  },
  {
    n: "03",
    label: "OPEN BY DEFAULT",
    title: "MIT licensed. Read every line.",
    body:
      "The whole app — main process, renderer, IPC, transcription pipeline — is on GitHub. Audit it. Fork it. Ship a private build for your company. We'd rather earn your trust than ask for it.",
  },
  {
    n: "04",
    label: "macOS, PROPERLY",
    title: "Built around how Macs actually work.",
    body:
      "Tray-first. Accessibility-based paste. JXA for app context. AudioWorklet capture. Native menu items. It feels native because it is — no Electron skin painted over a web app, no cross-platform compromises.",
  },
];

export function Choices() {
  return (
    <section
      id="choices"
      className="relative section"
      style={{ background: "var(--color-paper-deep)" }}
    >
      <div className="container-x">
        <EditorialMast>OPINIONS</EditorialMast>

        <div className="mt-8 grid-editorial">
          <h2
            className="headline-md col-span-12 md:col-span-9 text-balance"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)" }}
          >
            We made some{" "}
            <span className="serif-italic italic-lig">choices</span>{" "}
            on your behalf.
          </h2>
          <p
            className="body-prose mt-6 md:col-start-2 md:col-span-7"
            style={{ maxWidth: "62ch" }}
          >
            Most voice-to-text tools optimise for the company shipping them.
            VoiceFlow is built on a different bet: you should own the data, the
            cost, and the code. Four decisions, each one made deliberately, each
            one open to scrutiny.
          </p>
        </div>

        <span className="rule mt-16" aria-hidden />

        <ol className="mt-4">
          {PRINCIPLES.map((p, i) => (
            <PrincipleBlock key={p.n} principle={p} index={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function PrincipleBlock({
  principle,
  index,
}: {
  principle: (typeof PRINCIPLES)[number];
  index: number;
}) {
  return (
    <li className="list-none">
      <div className="grid-editorial py-[clamp(40px,6vw,72px)] relative">
        {/* Big hanging numeral — left margin on desktop, inline on mobile */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="col-span-12 md:col-span-2"
        >
          <span
            className="numeral block"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontStyle: "italic",
              fontSize: "clamp(56px, 8vw, 96px)",
              fontWeight: 400,
              lineHeight: 0.9,
              color: "var(--color-coral)",
              letterSpacing: "-0.04em",
              fontVariationSettings: '"SOFT" 30, "opsz" 96',
            }}
          >
            {principle.n}
          </span>
        </motion.div>

        {/* Label + title + body */}
        <div className="col-span-12 md:col-span-9 md:col-start-3 mt-2 md:mt-0">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mast"
            style={{ color: "var(--color-ink-muted)" }}
          >
            {principle.label}
          </motion.div>

          <motion.h3
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance"
            style={{
              fontFamily: "var(--font-fraunces)",
              fontSize: "clamp(28px, 3.4vw, 44px)",
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--color-ink)",
              fontVariationSettings: '"SOFT" 40, "opsz" 60',
            }}
          >
            {principle.title}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.55, delay: 0.32 }}
            className="mt-4 body-prose"
            style={{ maxWidth: "62ch" }}
          >
            {principle.body}
          </motion.p>
        </div>
      </div>
      {index < PRINCIPLES.length - 1 && (
        <span className="rule" aria-hidden />
      )}
    </li>
  );
}
