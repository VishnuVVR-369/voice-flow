import type { ReactNode } from "react";

type Props = {
  title?: string;
  variant?: "elevated" | "deep";
  children: ReactNode;
  className?: string;
};

// macOS window chrome — dark theme.
export function AppWindow({
  title,
  variant = "elevated",
  children,
  className = "",
}: Props) {
  const isDeep = variant === "deep";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${
        isDeep ? "border-white/[0.04]" : "border-white/[0.07]"
      } ${className}`}
      style={{
        background: isDeep
          ? "linear-gradient(180deg, #0a0a0a 0%, #050505 100%)"
          : "linear-gradient(180deg, rgba(28,25,23,0.55) 0%, rgba(12,12,12,0.85) 100%)",
        boxShadow:
          "0 50px 120px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]"
      >
        <div className="flex items-center gap-1.5">
          <span className="win-dot" style={{ background: "#4b4845" }} />
          <span className="win-dot" style={{ background: "#4b4845" }} />
          <span className="win-dot" style={{ background: "#4b4845" }} />
        </div>
        {title && (
          <span className="mono ml-2 truncate text-[11px] text-stone-500">
            {title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
