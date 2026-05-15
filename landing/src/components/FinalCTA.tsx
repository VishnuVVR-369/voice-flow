"use client";

import { motion } from "motion/react";
import { EditorialMast } from "./EditorialMast";
import { DOWNLOAD_URL, REPOSITORY_URL } from "@/lib/download";

export function FinalCTA() {
  return (
    <section
      id="download"
      className="relative"
      style={{
        background: "var(--color-paper)",
        paddingTop: "clamp(120px, 16vw, 200px)",
        paddingBottom: "clamp(120px, 16vw, 200px)",
      }}
    >
      <span className="rule absolute top-0 left-0 right-0" aria-hidden />
      <span
        className="rule absolute bottom-0 left-0 right-0"
        aria-hidden
      />

      <div className="container-x relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[1000px]"
        >
          <EditorialMast>READY WHEN YOU ARE</EditorialMast>

          <h2
            className="headline mt-8 text-balance"
            style={{ fontSize: "clamp(56px, 9vw, 132px)" }}
          >
            Stop typing.
            <br />
            <span className="serif-italic italic-lig">Start talking.</span>
          </h2>

          <p
            className="body-prose mt-10"
            style={{
              fontSize: "clamp(17px, 1.5vw, 22px)",
              maxWidth: "56ch",
            }}
          >
            Download VoiceFlow for macOS. Bring a Groq API key. Setup takes
            about a minute. After that, you stop noticing the keyboard.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
            <a
              href={DOWNLOAD_URL}
              className="btn-primary inline-flex"
              style={{ padding: "16px 28px", fontSize: 15 }}
            >
              <svg
                width="16"
                height="16"
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
          </div>

          <p
            className="mt-10 mast"
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
          </p>
        </motion.div>
      </div>
    </section>
  );
}
