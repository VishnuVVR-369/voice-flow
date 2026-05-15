"use client";

import { Waveform } from "./Waveform";

type Props = {
  state?: "recording" | "polishing" | "idle";
  caption?: string;
  className?: string;
};

// Pixel-precise mockup of the floating macOS overlay pill — light/editorial theme.
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
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{
                background:
                  "radial-gradient(circle, rgba(224,74,43,0.25) 0%, transparent 70%)",
              }}
            />
            <span
              className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{
                background:
                  "radial-gradient(circle, rgba(224,74,43,0.18) 0%, transparent 70%)",
                animationDelay: "1.2s",
              }}
            />
          </>
        )}

        {/* The pill */}
        <div
          className="relative flex items-center gap-3 rounded-full px-4 py-2.5"
          style={{
            background: "var(--color-ink)",
            boxShadow:
              "0 30px 60px -20px rgba(20,18,16,0.3), 0 0 0 1px rgba(20,18,16,0.08), 0 1px 0 rgba(255,255,255,0.06) inset",
          }}
        >
          {/* State indicator */}
          <span className="relative flex items-center">
            {isRecording && (
              <>
                <span
                  className="absolute inline-flex h-2.5 w-2.5 rounded-full animate-ping"
                  style={{ background: "rgba(224,74,43,0.6)" }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: "var(--color-coral)" }}
                />
              </>
            )}
            {isPolishing && (
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{
                  background: "var(--color-coral)",
                  boxShadow: "0 0 10px var(--color-coral)",
                  animation: "blink-cursor 1s step-end infinite",
                }}
              />
            )}
            {state === "idle" && (
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ background: "var(--color-ink-faint)" }}
              />
            )}
          </span>

          {/* Waveform */}
          <div style={{ color: "var(--color-paper)" }}>
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
          <span
            className="h-4 w-px"
            style={{ background: "rgba(245,239,230,0.15)" }}
          />

          {/* Hint */}
          <span className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                padding: "4px 6px",
                minWidth: 22,
                height: 22,
                borderRadius: 3,
                background: "rgba(245,239,230,0.08)",
                border: "1px solid rgba(245,239,230,0.18)",
                color: "rgba(245,239,230,0.85)",
              }}
            >
              ⌃
            </span>
            <span
              className="inline-flex items-center justify-center"
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 11,
                padding: "4px 6px",
                minWidth: 22,
                height: 22,
                borderRadius: 3,
                background: "rgba(245,239,230,0.08)",
                border: "1px solid rgba(245,239,230,0.18)",
                color: "rgba(245,239,230,0.85)",
              }}
            >
              Space
            </span>
          </span>
        </div>
      </div>

      {caption && (
        <p
          className="mast"
          style={{ color: "var(--color-ink-muted)" }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
