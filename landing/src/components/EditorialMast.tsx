type Props = {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  variant?: "plain" | "chip";
  className?: string;
};

export function EditorialMast({
  children,
  align = "left",
  variant = "plain",
  className = "",
}: Props) {
  const alignment =
    align === "center"
      ? "text-center justify-center"
      : align === "right"
      ? "text-right justify-end"
      : "text-left justify-start";

  if (variant === "chip") {
    const wrapperAlign =
      align === "center"
        ? "justify-center"
        : align === "right"
        ? "justify-end"
        : "justify-start";
    return (
      <div className={`flex ${wrapperAlign} ${className}`}>
        <span className="eyebrow-chip">
          <span className="eyebrow-chip__dot" />
          {children}
        </span>
      </div>
    );
  }

  return <div className={`mast flex ${alignment} ${className}`}>{children}</div>;
}
