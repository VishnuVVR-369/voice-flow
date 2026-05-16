"use client";

import { type ReactNode, type CSSProperties, useRef } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  tilt?: boolean;
};

// A card that paints a soft amber spotlight at the cursor position and
// optionally tilts in 3D space. The hot-path writes CSS variables only.
export function SpotlightCard({
  children,
  className = "",
  style,
  tilt = false,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty("--mx", `${x}%`);
    el.style.setProperty("--my", `${y}%`);
    if (tilt) {
      const rx = ((y - 50) / 50) * -3.5;
      const ry = ((x - 50) / 50) * 3.5;
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    if (tilt) {
      el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`spotlight ${className}`}
      style={{
        transition: tilt
          ? "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.25s ease, background 0.25s ease"
          : undefined,
        transformStyle: tilt ? "preserve-3d" : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
