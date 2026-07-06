"use client";

import { motion } from "motion/react";
import { Logo } from "./Logo";
import { REPOSITORY_URL } from "@/lib/download";

const NAV_LINKS = [
  { label: "GitHub", href: REPOSITORY_URL, external: true },
  { label: "License (MIT)", href: "/license", external: false },
  {
    label: "Releases",
    href: `${REPOSITORY_URL}/releases/tag/voiceflow@0.1.0`,
    external: true,
  },
  { label: "Privacy", href: "/privacy", external: false },
];

export function Footer() {
  return (
    <footer className="relative pb-12 pt-16">
      <div className="container-x">
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 0 }}
          className="rule-fade mb-12 block"
          aria-hidden
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex flex-col gap-3">
            <Logo />
            <span className="mono text-[11px] tracking-[0.16em] uppercase text-stone-600">
              macOS 13+ · Apple silicon
            </span>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-7 gap-y-3"
            aria-label="Footer"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                {...(link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
                whileHover={{ y: -2 }}
                className="text-link"
                style={{ fontSize: 13.5 }}
              >
                {link.label}
              </motion.a>
            ))}
          </nav>

          <div
            className="mono text-[10.5px] tracking-[0.18em] uppercase text-amber-400/80"
            aria-hidden
          >
            <span className="inline-block animate-pulse">—</span> Fin.
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-[12px] text-stone-600">
            © 2026 VoiceFlow. Crafted in the open.
          </p>
          <p className="text-[12px] text-stone-600 inline-flex items-center gap-1.5">
            <span>Built with</span>
            <motion.span
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              className="text-amber-400 inline-block"
            >
              ◆
            </motion.span>
            <span>Whisper · Groq · Electron</span>
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
