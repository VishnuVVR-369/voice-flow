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

// A purely-CSS animated bar visualizer. Heights and delays are deterministic
// (seeded by index) so SSR matches client and there's no hydration flash.
export function Waveform({
  bars = 48,
  height = 56,
  gap = 3,
  width = 4,
  active = true,
  className = "",
  color = "currentColor",
}: Props) {
  // Seeded pseudo-random pattern that *looks* organic but is deterministic.
  // Round to a fixed precision so server and client serialize identically
  // (browser CSSOM rounds long floats, which would otherwise trip hydration).
  const pattern = (i: number) => {
    const s = Math.sin(i * 12.9898) * 43758.5453;
    return Math.round((s - Math.floor(s)) * 1e4) / 1e4; // 0..1, 4dp
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
        const minH = round(0.18 + seed * 0.35);
        const duration = round(0.8 + pattern(i + 99) * 0.9);
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
              opacity: active ? 1 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}
