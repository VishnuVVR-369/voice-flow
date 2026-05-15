type Props = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

export function Logo({ size = 26, withWordmark = true, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 group ${className}`}>
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="absolute inset-0 rounded-[3px]"
          style={{
            background: "var(--color-ink)",
            boxShadow:
              "0 0 0 1px var(--color-coral) inset, 0 1px 0 var(--color-ink)",
          }}
        />
        <svg
          width={size * 0.62}
          height={size * 0.62}
          viewBox="0 0 24 24"
          fill="none"
          className="relative"
        >
          <g
            stroke="var(--color-paper)"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="6" y1="9" x2="6" y2="15" />
            <line x1="10" y1="6" x2="10" y2="18" />
            <line x1="14" y1="4" x2="14" y2="20" />
            <line x1="18" y1="8" x2="18" y2="16" />
          </g>
        </svg>
      </span>
      {withWordmark && (
        <span
          className="relative italic logo-wordmark"
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 19,
            fontWeight: 400,
            letterSpacing: "-0.015em",
            color: "var(--color-ink)",
            fontVariationSettings: '"SOFT" 50, "opsz" 24',
          }}
        >
          Voiceflow
        </span>
      )}
    </span>
  );
}
