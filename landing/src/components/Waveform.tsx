"use client";

type Props = {
  bars?: number;
  height?: number;
  gap?: number;
  width?: number;
  active?: boolean;
  className?: string;
  color?: string;
};

// CSS-only animated bar visualizer. Deterministic heights & delays
// so SSR matches client (no hydration mismatch).
export function Waveform({
  bars = 48,
  height = 56,
  gap = 3,
  width = 4,
  active = true,
  className = "",
  color = "currentColor",
}: Props) {
  const pattern = (i: number) => {
    const s = Math.sin(i * 12.9898) * 43758.5453;
    return Math.round((s - Math.floor(s)) * 1e4) / 1e4;
  };
  const round = (n: number) => Math.round(n * 1e4) / 1e4;

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{ height, gap }}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => {
        const seed = pattern(i);
        const minH = round(0.2 + seed * 0.35);
        const duration = round(0.75 + pattern(i + 99) * 0.85);
        const delay = round(pattern(i + 7) * -1.4);
        return (
          <span
            key={i}
            style={{
              width,
              height: "100%",
              background: color,
              borderRadius: width / 2,
              transformOrigin: "center",
              transform: `scaleY(${minH})`,
              animation: active
                ? `wave-bar ${duration}s ease-in-out ${delay}s infinite`
                : "none",
              opacity: active ? 1 : 0.35,
            }}
          />
        );
      })}
    </div>
  );
}
