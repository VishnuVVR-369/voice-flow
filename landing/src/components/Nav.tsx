"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Logo } from "./Logo";
import { Magnetic } from "./Magnetic";
import { DOWNLOAD_URL, REPOSITORY_URL } from "@/lib/download";

const LINKS = [
  { label: "Works everywhere", href: "#everywhere", id: "everywhere" },
  { label: "How it works", href: "#how", id: "how" },
  { label: "Principles", href: "#choices", id: "choices" },
  { label: "Docs", href: "/docs", id: "docs" },
  { label: "Source", href: REPOSITORY_URL, external: true, id: "source" },
] as const;

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track which section is in view to drive the active indicator
  useEffect(() => {
    const sections = ["everywhere", "how", "choices"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0.1, 0.5, 0.9] }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  const indicatorTarget = hovered ?? active;

  return (
    <motion.header
      ref={navRef}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-xl border-b border-white/[0.06] bg-[#070707]/70"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div
        className={`container-x flex items-center justify-between transition-all duration-500 ${
          scrolled ? "h-[60px]" : "h-[76px]"
        }`}
      >
        <a
          href="#top"
          className="flex items-center transition-transform duration-300 hover:scale-[1.02]"
          aria-label="VoiceFlow home"
        >
          <Logo />
        </a>

        <nav
          aria-label="Primary"
          onMouseLeave={() => setHovered(null)}
          className="hidden md:flex relative items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.025] px-1.5 py-1 backdrop-blur-md"
        >
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onMouseEnter={() => setHovered(link.id)}
              {...("external" in link && link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className={`relative rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                indicatorTarget === link.id
                  ? "text-amber-200"
                  : "text-stone-400 hover:text-stone-100"
              }`}
            >
              <AnimatePresence>
                {indicatorTarget === link.id && (
                  <motion.span
                    layoutId="nav-pill"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.06) 100%)",
                      border: "1px solid rgba(245,158,11,0.25)",
                      boxShadow: "0 0 24px rgba(245,158,11,0.18)",
                    }}
                    aria-hidden
                  />
                )}
              </AnimatePresence>
              <span className="relative">{link.label}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.025] px-3.5 py-1.5 text-[13px] font-medium text-stone-400 backdrop-blur-md transition-all duration-300 hover:border-white/[0.18] hover:text-stone-100 hover:bg-white/[0.04]"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.13c-3.2.7-3.88-1.36-3.88-1.36-.53-1.35-1.29-1.71-1.29-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.27 3.39.97.1-.75.41-1.27.74-1.56-2.55-.29-5.24-1.27-5.24-5.67 0-1.25.45-2.27 1.18-3.08-.12-.29-.51-1.45.11-3.03 0 0 .96-.31 3.15 1.18.91-.25 1.89-.38 2.86-.39.97.01 1.95.14 2.86.39 2.18-1.49 3.14-1.18 3.14-1.18.63 1.58.24 2.74.12 3.03.74.81 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.42.36.79 1.08.79 2.18v3.23c0 .31.21.67.79.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z" />
            </svg>
            GitHub
          </a>
          <Magnetic strength={0.25}>
            <a
              href={DOWNLOAD_URL}
              className="btn-primary shine"
              style={{ padding: "9px 18px", fontSize: 13 }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M16.365 1.43c.04 1.07-.357 2.1-1.05 2.86-.7.78-1.84 1.36-2.95 1.27-.06-1.04.43-2.13 1.1-2.84.74-.79 1.99-1.4 2.9-1.29zM20.2 17.42c-.49 1.13-.72 1.62-1.34 2.6-.87 1.36-2.1 3.06-3.62 3.07-1.36.01-1.71-.88-3.55-.86-1.84.01-2.23.88-3.59.87-1.52-.01-2.69-1.55-3.56-2.91-2.43-3.83-2.7-8.32-1.19-10.7C4.42 7.84 6.18 6.83 7.86 6.83c1.66 0 2.7.92 4.08.92 1.34 0 2.16-.92 4.08-.92 1.5 0 3.08.81 4.21 2.21-3.7 2.03-3.1 7.32.97 8.38z" />
              </svg>
              Download
            </a>
          </Magnetic>
        </div>
      </div>
    </motion.header>
  );
}
