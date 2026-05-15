import type { ReactNode } from "react";

type Props = {
  title?: string;
  variant?: "paper" | "ink";
  children: ReactNode;
  className?: string;
};

// Simplified macOS window chrome — light editorial theme.
export function AppWindow({
  title,
  variant = "paper",
  children,
  className = "",
}: Props) {
  const isInk = variant === "ink";

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: isInk ? "var(--color-ink)" : "var(--color-paper-soft)",
        border: isInk
          ? "1px solid var(--color-ink)"
          : "1px solid var(--color-ink-faint)",
        borderRadius: 6,
        boxShadow: isInk
          ? "0 30px 60px -25px rgba(20,18,16,0.35)"
          : "0 30px 60px -25px rgba(20,18,16,0.18)",
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{
          borderBottom: isInk
            ? "1px solid rgba(245,239,230,0.1)"
            : "1px solid var(--color-ink-faint)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="win-dot" style={{ background: "#ff5f57" }} />
          <span className="win-dot" style={{ background: "#febc2e" }} />
          <span className="win-dot" style={{ background: "#28c840" }} />
        </div>
        {title && (
          <span
            className="mono ml-2 truncate"
            style={{
              fontSize: 11,
              color: isInk ? "rgba(245,239,230,0.6)" : "var(--color-ink-muted)",
            }}
          >
            {title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
