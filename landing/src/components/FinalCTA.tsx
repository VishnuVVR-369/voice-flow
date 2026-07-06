"use client";

import { motion } from "motion/react";
import { OverlayMockup } from "./OverlayMockup";
import { Magnetic } from "./Magnetic";
import { DOWNLOAD_URL, REPOSITORY_URL } from "@/lib/download";

export function FinalCTA() {
  return (
    <section
      id="download"
      className="relative"
      style={{
        paddingTop: "clamp(100px, 14vw, 180px)",
        paddingBottom: "clamp(100px, 14vw, 180px)",
      }}
    >
      <div className="container-x relative">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-120px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="gradient-border relative overflow-hidden rounded-[32px] border border-white/[0.07] px-6 py-14 sm:py-20 lg:py-24 lg:px-16"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,25,23,0.55) 0%, rgba(7,7,7,0.95) 100%)",
            boxShadow:
              "0 80px 200px -40px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Atmosphere */}
          <motion.span
            initial={{ opacity: 0, scale: 0.85 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-amber-500/[0.14] blur-[100px] animate-breathe"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/45 to-transparent"
            aria-hidden
          />
          <span
            className="pointer-events-none absolute inset-0 opacity-30 bg-gridlines"
            style={{
              mask: "radial-gradient(circle at center, black 0%, transparent 70%)",
              WebkitMask:
                "radial-gradient(circle at center, black 0%, transparent 70%)",
            }}
            aria-hidden
          />
          {/* Slow conic light pass */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background:
                "conic-gradient(from 90deg at 50% 120%, transparent 0deg, rgba(245,158,11,0.18) 30deg, transparent 80deg)",
              maskImage:
                "radial-gradient(circle at 50% 120%, black 0%, transparent 60%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 120%, black 0%, transparent 60%)",
            }}
            animate={{ rotate: [0, 8, -4, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="relative grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-8">
            <div className="col-span-12 lg:col-span-7">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <span className="eyebrow-chip shine">
                  <span className="eyebrow-chip__dot" />
                  Ready when you are
                </span>
              </motion.div>

              {/* whileInView lives on the (unclipped) h2 — the masked spans
                  inherit it via variants, since a fully clipped element never
                  intersects for IntersectionObserver. */}
              <motion.h2
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="headline mt-7 text-balance"
                style={{ fontSize: "clamp(44px, 7vw, 96px)" }}
              >
                <span className="reveal-mask block">
                  <motion.span
                    variants={{ hidden: { y: "110%" }, show: { y: "0%" } }}
                    transition={{
                      duration: 0.95,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.2,
                    }}
                    className="inline-block"
                  >
                    Stop typing.
                  </motion.span>
                </span>
                <span className="reveal-mask block">
                  <motion.span
                    variants={{ hidden: { y: "110%" }, show: { y: "0%" } }}
                    transition={{
                      duration: 0.95,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.32,
                    }}
                    className="serif-italic text-grad-amber amber-glow inline-block"
                  >
                    Start talking.
                  </motion.span>
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.5 }}
                className="body-prose mt-7"
                style={{
                  fontSize: "clamp(16px, 1.3vw, 20px)",
                  maxWidth: "52ch",
                }}
              >
                Download VoiceFlow for macOS. Setup takes about a minute.
                After that, you stop noticing the keyboard.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <Magnetic strength={0.3}>
                  <a
                    href={DOWNLOAD_URL}
                    className="btn-primary shine w-full sm:w-auto"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path d="M16.365 1.43c.04 1.07-.357 2.1-1.05 2.86-.7.78-1.84 1.36-2.95 1.27-.06-1.04.43-2.13 1.1-2.84.74-.79 1.99-1.4 2.9-1.29zM20.2 17.42c-.49 1.13-.72 1.62-1.34 2.6-.87 1.36-2.1 3.06-3.62 3.07-1.36.01-1.71-.88-3.55-.86-1.84.01-2.23.88-3.59.87-1.52-.01-2.69-1.55-3.56-2.91-2.43-3.83-2.7-8.32-1.19-10.7C4.42 7.84 6.18 6.83 7.86 6.83c1.66 0 2.7.92 4.08.92 1.34 0 2.16-.92 4.08-.92 1.5 0 3.08.81 4.21 2.21-3.7 2.03-3.1 7.32.97 8.38z" />
                    </svg>
                    Download for Mac
                  </a>
                </Magnetic>
                <a
                  href={REPOSITORY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link group"
                >
                  View source on GitHub
                  <span
                    aria-hidden
                    className="text-amber-400 inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.75 }}
                className="mt-7 mono text-[11px] tracking-[0.16em] uppercase text-stone-500"
              >
                <span className="text-amber-400">●</span> MIT
                <span className="text-stone-700 mx-2.5">·</span>
                Open source
                <span className="text-stone-700 mx-2.5">·</span>
                macOS 13+
              </motion.p>
            </div>

            {/* Right column — floating pill */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.4,
              }}
              className="col-span-12 lg:col-span-5 lg:col-start-8 flex items-center justify-center"
            >
              <div className="relative animate-float scale-[0.82] origin-center sm:scale-100">
                <OverlayMockup state="recording" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
