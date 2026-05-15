import { Logo } from "./Logo";
import { REPOSITORY_URL } from "@/lib/download";

const NAV_LINKS = [
  { label: "GitHub", href: REPOSITORY_URL },
  { label: "License (MIT)", href: `${REPOSITORY_URL}/blob/main/LICENSE` },
  { label: "Releases", href: `${REPOSITORY_URL}/releases` },
  { label: "Privacy", href: `${REPOSITORY_URL}#privacy` },
];

export function Footer() {
  return (
    <footer className="relative pb-12 pt-16">
      <div className="container-x">
        <span className="rule mb-12" aria-hidden />

        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <Logo />
            <span className="mono text-[11px] tracking-[0.16em] uppercase text-stone-600">
              v0.1.0 · macOS 13+ · Apple silicon
            </span>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-7 gap-y-3"
            aria-label="Footer"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13.5px] text-stone-400 transition-colors hover:text-amber-300"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div
            className="mono text-[10.5px] tracking-[0.18em] uppercase text-amber-400/80"
            aria-hidden
          >
            — Fin.
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-stone-600">
            © 2026 VoiceFlow. Crafted in the open.
          </p>
          <p className="text-[12px] text-stone-600 inline-flex items-center gap-1.5">
            <span>Built with</span>
            <span className="text-amber-400">◆</span>
            <span>Whisper · Groq · Electron</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
