"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { DOWNLOAD_URL } from "@/lib/download";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md"
          : ""
      }`}
      style={{
        backgroundColor: scrolled
          ? "rgba(245, 239, 230, 0.85)"
          : "transparent",
        borderBottom: scrolled
          ? "1px solid rgba(20, 18, 16, 0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="container-x flex items-center justify-between h-[68px]">
        <a
          href="#top"
          className="flex items-center"
          aria-label="Voiceflow home"
        >
          <Logo />
        </a>

        <a
          href={DOWNLOAD_URL}
          className="btn-primary"
          style={{ padding: "10px 18px", fontSize: 13.5 }}
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
      </div>
    </header>
  );
}
