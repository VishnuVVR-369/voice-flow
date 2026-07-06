import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRightIcon, ChevronDownIcon, type DocsIcon } from "./icons";

/* Server-rendered presentational diagram primitives. They compose function
   icons directly, so they must stay server components (no client boundary) —
   the surrounding section already fades them in via <Reveal>. */

/* ─── Wrapper ─────────────────────────────────────────────────────── */

type DiagramProps = {
  children: ReactNode;
  caption?: string;
  label?: string;
  className?: string;
};

export function Diagram({
  children,
  caption,
  label = "Diagram",
  className,
}: DiagramProps) {
  return (
    <figure
      className={cn(
        "mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40",
        "bg-[radial-gradient(120%_120%_at_50%_0%,rgba(245,158,11,0.06),transparent_60%)]",
        className,
      )}
    >
      <div
        className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2.5"
        aria-hidden
      >
        <span className="h-2 w-2 rounded-full bg-amber-400/80" />
        <span className="mono text-[11px] tracking-[0.16em] text-stone-500 uppercase">
          {label}
        </span>
      </div>
      <div className="overflow-x-auto px-4 py-6 sm:px-6">{children}</div>
      {caption ? (
        <figcaption className="border-t border-white/[0.06] px-4 py-2.5 text-xs leading-5 text-stone-500 sm:px-6">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* ─── Flow chain (linear pipeline) ────────────────────────────────── */

type FlowTone = "default" | "amber" | "sky" | "violet" | "emerald";

const toneStyles: Record<FlowTone, string> = {
  default: "border-white/[0.1] bg-white/[0.03] text-stone-200",
  amber: "border-amber-400/25 bg-amber-400/[0.08] text-amber-100",
  sky: "border-sky-400/25 bg-sky-400/[0.08] text-sky-100",
  violet: "border-violet-400/25 bg-violet-400/[0.08] text-violet-100",
  emerald: "border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-100",
};

export type FlowNode = {
  label: string;
  sub?: string;
  tone?: FlowTone;
  icon?: DocsIcon;
};

export function FlowChain({
  nodes,
  className,
}: {
  nodes: FlowNode[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-stretch gap-2 md:flex-row md:items-stretch",
        className,
      )}
    >
      {nodes.map((node, index) => {
        const Icon = node.icon;
        return (
          <div
            key={`${node.label}-${index}`}
            className="flex flex-col items-stretch gap-2 md:flex-1 md:flex-row md:items-center"
          >
            <div
              className={cn(
                "flex min-h-[3.5rem] flex-1 flex-col justify-center rounded-xl border px-3.5 py-2.5 text-center",
                toneStyles[node.tone ?? "default"],
              )}
            >
              <span className="flex items-center justify-center gap-1.5 text-[13px] font-semibold">
                {Icon ? <Icon size={14} /> : null}
                {node.label}
              </span>
              {node.sub ? (
                <span className="mono mt-1 text-[10.5px] leading-tight tracking-[0.02em] text-stone-500">
                  {node.sub}
                </span>
              ) : null}
            </div>
            {index < nodes.length - 1 ? (
              <span
                className="flex shrink-0 items-center justify-center text-amber-400/70"
                aria-hidden
              >
                <ArrowRightIcon size={17} className="hidden md:block" />
                <ChevronDownIcon size={17} className="md:hidden" />
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Process map (columns of grouped items) ──────────────────────── */

export type ProcessColumn = {
  title: string;
  subtitle?: string;
  tone?: FlowTone;
  icon?: DocsIcon;
  items: string[];
};

export function ProcessMap({ columns }: { columns: ProcessColumn[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => {
        const Icon = column.icon;
        return (
          <div
            key={column.title}
            className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02]"
          >
            <div
              className={cn(
                "flex items-center gap-2 border-b border-white/[0.07] px-3.5 py-2.5",
                toneStyles[column.tone ?? "default"],
              )}
            >
              {Icon ? <Icon size={15} /> : null}
              <span className="text-[13px] font-semibold">{column.title}</span>
            </div>
            {column.subtitle ? (
              <p className="mono border-b border-white/[0.05] px-3.5 py-2 text-[10.5px] tracking-[0.02em] text-stone-500">
                {column.subtitle}
              </p>
            ) : null}
            <ul className="divide-y divide-white/[0.04]">
              {column.items.map((item) => (
                <li
                  key={item}
                  className="mono px-3.5 py-2 text-[11.5px] leading-snug text-stone-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Lane sequence (actor → action steps) ────────────────────────── */

export type LaneStep = {
  lane: string;
  title: string;
  detail?: string;
  tone?: FlowTone;
};

export function LaneSequence({ steps }: { steps: LaneStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => (
        <li
          key={`${step.lane}-${index}`}
          className="relative grid grid-cols-[auto_1fr] gap-4 pb-5 last:pb-0"
        >
          {index < steps.length - 1 ? (
            <span
              className="absolute top-8 bottom-0 left-[15px] w-px -translate-x-1/2 bg-gradient-to-b from-amber-400/30 to-transparent"
              aria-hidden
            />
          ) : null}
          <span className="z-10 mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/[0.08] mono text-[11px] text-amber-200">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 pt-0.5">
            <span
              className={cn(
                "mono mb-1 inline-block rounded border px-1.5 py-0.5 text-[10px] tracking-[0.08em] uppercase",
                toneStyles[step.tone ?? "default"],
              )}
            >
              {step.lane}
            </span>
            <p className="text-sm font-medium text-stone-100">{step.title}</p>
            {step.detail ? (
              <p className="mt-1 text-[13px] leading-6 text-stone-400">
                {step.detail}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
