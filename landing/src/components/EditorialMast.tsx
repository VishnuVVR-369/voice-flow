type Props = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  flank?: boolean;
  className?: string;
};

// Newspaper-style mast label. Mono, uppercase, generous tracking.
// Optionally bracketed with em-dashes ("— ISSUE 001 · MAY 2026 —").
export function EditorialMast({
  children,
  align = "left",
  flank = true,
  className = "",
}: Props) {
  const alignment =
    align === "center"
      ? "text-center"
      : align === "right"
      ? "text-right"
      : "text-left";

  return (
    <div className={`mast ${alignment} ${className}`}>
      {flank && <span aria-hidden>— </span>}
      {children}
      {flank && <span aria-hidden> —</span>}
    </div>
  );
}
