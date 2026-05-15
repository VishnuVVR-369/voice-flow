"use client";

import { Waveform } from "./Waveform";

type Props = {
  state?: "recording" | "polishing" | "idle";
  caption?: string;
  className?: string;
};

// Pixel-precise mockup of the floating macOS overlay pill — dark amber theme.
export function OverlayMockup({
  state = "recording",
  caption,
  className = "",
}: Props) {
  const isRecording = state === "recording";
  const isPolishing = state === "polishing";

  return (
    <div
      className={`relative inline-flex flex-col items-center gap-3 ${className}`}
    >
      <div className="relative">
        {/* Soft halo behind pill */}
        {isRecording && (
          <>
            <span
              className="absolute inset-[-30%] rounded-full animate-pulse-ring"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.32) 0%, transparent 65%)",
              }}
            />
            <span
              className="absolute inset-[-30%] rounded-full animate-pulse-ring"
              style={{
                background:
                  "radial-gradient(circle, rgba(245,158,11,0.22) 0%, transparent 65%)",
                animationDelay: "1.2s",
              }}
            />
          </>
        )}

        {/* The pill */}
        <div
          className="relative flex items-center gap-3 rounded-full px-4 py-2.5 backdrop-blur-md"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,25,23,0.85) 0%, rgba(12,12,12,0.92) 100%)",
            boxShadow:
              "0 30px 70px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.06) inset, 0 0 30px rgba(245,158,11,0.08)",
          }}
        >
          {/* State indicator */}
          <span className="relative flex items-center">
            {isRecording && (
              <>
                <span
                  className="absolute inline-flex h-2.5 w-2.5 rounded-full animate-ping"
                  style={{ background: "rgba(245,158,11,0.6)" }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{
                    background: "var(--color-amber-400)",
                    boxShadow: "0 0 10px rgba(245,158,11,0.9)",
                  }}
                />
              </>
            )}
            {isPolishing && (
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{
                  background: "var(--color-amber-400)",
                  boxShadow: "0 0 12px var(--color-amber-400)",
                  animation: "blink-cursor 1s step-end infinite",
                }}
              />
            )}
            {state === "idle" && (
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--color-stone-600)" }}
              />
            )}
          </span>

          {/* Waveform */}
          <div className="text-amber-300/95">
            <Waveform
              bars={28}
              height={24}
              width={2.5}
              gap={3}
              active={isRecording}
              color="currentColor"
            />
          </div>

          {/* Timer or label */}
          <span
            className="mono tabular-nums tracking-wider"
            style={{
              fontSize: 11,
              color: "rgba(245,239,230,0.85)",
            }}
          >
            {isRecording ? "00:04" : isPolishing ? "Polishing" : "Ready"}
          </span>

          {/* Divider */}
          <span className="h-4 w-px bg-white/[0.1]" />

          {/* Hint */}
          <span className="flex items-center gap-1.5">
            <span className="keycap">⌃</span>
            <span className="keycap">Space</span>
          </span>
        </div>
      </div>

      {caption && (
        <p className="mast" style={{ color: "var(--color-stone-500)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}
