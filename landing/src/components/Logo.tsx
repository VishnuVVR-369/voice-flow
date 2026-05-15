type Props = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

export function Logo({
  size = 28,
  withWordmark = true,
  className = "",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 group ${className}`}>
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Amber bloom behind mark */}
        <span
          className="absolute inset-[-6px] rounded-full opacity-70 blur-md transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 65%)",
          }}
        />
        {/* Faceted plate */}
        <span
          className="absolute inset-0 rounded-[8px] border border-amber-500/40"
          style={{
            background:
              "linear-gradient(140deg, rgba(245,158,11,0.95) 0%, rgba(217,119,6,0.95) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.25), 0 6px 18px -8px rgba(245,158,11,0.7)",
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
            stroke="#070707"
            strokeWidth="2.3"
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
        <span className="inline-flex items-baseline gap-[1px]">
          <span
            className="font-semibold tracking-tight text-stone-100"
            style={{
              fontFamily: "var(--font-geist-sans)",
              fontSize: size * 0.68,
              letterSpacing: "-0.025em",
            }}
          >
            Voice
          </span>
          <span
            className="serif-italic text-amber-300"
            style={{
              fontSize: size * 0.74,
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              lineHeight: 1,
            }}
          >
            flow
          </span>
        </span>
      )}
    </span>
  );
}
