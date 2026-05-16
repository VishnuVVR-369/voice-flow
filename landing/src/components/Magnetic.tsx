"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";

type Props = {
  children: ReactNode;
  strength?: number;
  className?: string;
  style?: CSSProperties;
};

// Wraps an element and pulls its inner `.magnet` slightly toward the cursor.
// Cheap: writes CSS variables on the inner span, no React state churn.
export function Magnetic({
  children,
  strength = 0.35,
  className = "",
  style,
}: Props) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent<HTMLSpanElement>) => {
    const el = wrapRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = (e.clientX - cx) * strength;
    const dy = (e.clientY - cy) * strength;
    inner.style.setProperty("--tx", `${dx}px`);
    inner.style.setProperty("--ty", `${dy}px`);
  };

  const onLeave = () => {
    const inner = innerRef.current;
    if (!inner) return;
    inner.style.setProperty("--tx", "0px");
    inner.style.setProperty("--ty", "0px");
  };

  return (
    <span
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-block ${className}`}
      style={style}
    >
      <span ref={innerRef} className="magnet">
        {children}
      </span>
    </span>
  );
}
