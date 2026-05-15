import { Logo } from "./Logo";
import { REPOSITORY_URL } from "@/lib/download";

export function Footer() {
  return (
    <footer className="relative pb-16 pt-16">
      <div className="container-x">
        <span className="rule mb-12" aria-hidden />

        <div className="flex flex-col gap-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <Logo />
            <span
              className="mast"
              style={{ color: "var(--color-ink-faint)" }}
            >
              v0.1.0 · macOS 13+ · Apple silicon
            </span>
          </div>

          <nav
            className="flex flex-wrap items-center gap-x-8 gap-y-3"
            aria-label="Footer"
          >
            <a
              href={REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              GitHub
            </a>
            <a
              href={`${REPOSITORY_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              License (MIT)
            </a>
            <a
              href={`${REPOSITORY_URL}/releases`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              Releases
            </a>
            <a
              href={`${REPOSITORY_URL}#privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px]"
              style={{ color: "var(--color-ink-soft)" }}
            >
              Privacy
            </a>
          </nav>

          <div
            className="mast"
            style={{
              color: "var(--color-coral)",
              fontSize: 12,
              letterSpacing: "0.18em",
            }}
            aria-hidden
          >
            — FIN.
          </div>
        </div>
      </div>
    </footer>
  );
}
