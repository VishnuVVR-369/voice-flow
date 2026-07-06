import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  InfoIcon,
  LightbulbIcon,
  XCircleIcon,
  type DocsIcon,
} from "./icons";

/* Client islands re-exported so content modules import the whole kit from one
   place. A server module may re-export client components. */
export { CodeBlock } from "./CodeBlock";
export { Accordion } from "./Accordion";
export {
  Diagram,
  FlowChain,
  ProcessMap,
  LaneSequence,
  type FlowNode,
  type ProcessColumn,
  type LaneStep,
} from "./Diagram";
export {
  SchemaDiagram,
  type SchemaTable,
  type SchemaColumn,
  type SchemaRelation,
  type SchemaBadge,
} from "./SchemaDiagram";

/* ─── Callout ─────────────────────────────────────────────────────── */

type CalloutType = "note" | "tip" | "warning" | "check" | "danger";

const calloutStyles: Record<
  CalloutType,
  { wrap: string; icon: DocsIcon; iconColor: string; title: string }
> = {
  note: {
    wrap: "border-sky-400/20 bg-sky-400/[0.05]",
    icon: InfoIcon,
    iconColor: "text-sky-300",
    title: "text-sky-100",
  },
  tip: {
    wrap: "border-emerald-400/20 bg-emerald-400/[0.05]",
    icon: LightbulbIcon,
    iconColor: "text-emerald-300",
    title: "text-emerald-100",
  },
  warning: {
    wrap: "border-amber-400/25 bg-amber-400/[0.06]",
    icon: AlertIcon,
    iconColor: "text-amber-300",
    title: "text-amber-100",
  },
  check: {
    wrap: "border-emerald-400/20 bg-emerald-400/[0.05]",
    icon: CheckCircleIcon,
    iconColor: "text-emerald-300",
    title: "text-emerald-100",
  },
  danger: {
    wrap: "border-red-400/20 bg-red-400/[0.05]",
    icon: XCircleIcon,
    iconColor: "text-red-300",
    title: "text-red-100",
  },
};

export function Callout({
  children,
  type = "note",
  title,
}: {
  children: ReactNode;
  type?: CalloutType;
  title?: string;
}) {
  const style = calloutStyles[type];
  const Icon = style.icon;

  return (
    <div
      className={cn(
        "mt-5 flex gap-3 rounded-xl border p-4 text-sm leading-6 text-stone-200",
        style.wrap,
      )}
    >
      <Icon size={17} className={cn("mt-0.5 shrink-0", style.iconColor)} />
      <div className="min-w-0">
        {title ? (
          <p className={cn("mb-1 font-semibold", style.title)}>{title}</p>
        ) : null}
        <div className="[&_code]:mono [&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Lists ───────────────────────────────────────────────────────── */

export function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm leading-6 text-stone-300">
      {items.map((item, index) => (
        <li className="flex gap-3" key={index}>
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300/80" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function StepList({
  items,
}: {
  items: Array<{ title: string; description: ReactNode }>;
}) {
  return (
    <ol className="mt-5 space-y-0">
      {items.map((item, index) => (
        <li
          className="relative grid grid-cols-[2rem_1fr] gap-4 pb-6 last:pb-0"
          key={item.title}
        >
          {index < items.length - 1 ? (
            <span className="absolute top-9 bottom-0 left-4 w-px -translate-x-1/2 bg-gradient-to-b from-amber-400/25 to-transparent" />
          ) : null}
          <span className="z-10 flex h-8 w-8 items-center justify-center rounded-md border border-amber-400/20 bg-amber-400/[0.08] mono text-xs text-amber-200">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="pt-1">
            <span className="block text-sm font-semibold text-stone-100">
              {item.title}
            </span>
            <span className="mt-1 block text-sm leading-6 text-stone-400">
              {item.description}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ─── Grids & cards ───────────────────────────────────────────────── */

export function InfoGrid({
  items,
  columns = 2,
}: {
  items: Array<{ title: string; description: ReactNode; icon?: DocsIcon }>;
  columns?: 2 | 3;
}) {
  return (
    <div
      className={cn(
        "mt-5 grid gap-3",
        columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
            key={item.title}
          >
            {Icon ? <Icon size={18} className="mb-2.5 text-amber-300" /> : null}
            <h3 className="text-sm font-semibold text-stone-100">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-stone-400">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

type CardItem = {
  title: string;
  description: ReactNode;
  href?: string;
  icon?: DocsIcon;
};

export function CardGrid({
  items,
  columns = 2,
}: {
  items: CardItem[];
  columns?: 1 | 2 | 3;
}) {
  return (
    <div
      className={cn(
        "mt-5 grid gap-3",
        columns === 3
          ? "sm:grid-cols-3"
          : columns === 1
            ? "grid-cols-1"
            : "sm:grid-cols-2",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              {Icon ? (
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-400/15 bg-amber-400/[0.07] text-amber-300">
                  <Icon size={18} />
                </span>
              ) : null}
              {item.href ? (
                <ArrowUpRightIcon
                  size={16}
                  className="mt-1 text-stone-600 transition-colors group-hover/card:text-amber-300"
                />
              ) : null}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-stone-100">
              {item.title}
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-stone-400">
              {item.description}
            </p>
          </>
        );

        return item.href ? (
          <Link
            className="group/card rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition-colors hover:border-amber-400/25 hover:bg-amber-400/[0.04]"
            href={item.href}
            key={item.title}
          >
            {inner}
          </Link>
        ) : (
          <div
            className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4"
            key={item.title}
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Score bars (quality-weighting visual) ───────────────────────── */

export function ScoreBar({
  rows,
  caption,
}: {
  rows: Array<{ label: string; value: number; display?: string }>;
  caption?: string;
}) {
  return (
    <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            className="grid grid-cols-[8.5rem_1fr_2.5rem] items-center gap-3"
            key={row.label}
          >
            <span className="truncate text-xs text-stone-400">{row.label}</span>
            <span className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-amber-500/70 to-amber-300"
                style={{
                  width: `${Math.max(0, Math.min(1, row.value)) * 100}%`,
                }}
              />
            </span>
            <span className="mono text-right text-xs text-amber-200">
              {row.display ?? row.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      {caption ? (
        <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-stone-500">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Tables ──────────────────────────────────────────────────────── */

export function EnvTable({
  rows,
}: {
  rows: Array<{ name: string; purpose: ReactNode; default?: string }>;
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/[0.035] text-xs text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">Setting</th>
            <th className="px-4 py-3 font-medium">Purpose</th>
            <th className="px-4 py-3 font-medium">Default</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="mono px-4 py-3 align-top text-xs whitespace-nowrap text-amber-200">
                {row.name}
              </td>
              <td className="px-4 py-3 align-top leading-6 text-stone-300">
                {row.purpose}
              </td>
              <td className="mono px-4 py-3 align-top text-xs whitespace-nowrap text-stone-400">
                {row.default ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FieldTable({
  rows,
  caption,
  columns = ["Field", "Type", "Description"],
}: {
  rows: Array<{ name: string; type: string; description: ReactNode }>;
  caption?: string;
  columns?: [string, string, string];
}) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-white/[0.035] text-xs text-stone-500">
          <tr>
            <th className="px-4 py-3 font-medium">{columns[0]}</th>
            <th className="px-4 py-3 font-medium">{columns[1]}</th>
            <th className="px-4 py-3 font-medium">{columns[2]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="mono px-4 py-3 align-top text-xs whitespace-nowrap text-amber-200">
                {row.name}
              </td>
              <td className="mono px-4 py-3 align-top text-xs whitespace-nowrap text-stone-400">
                {row.type}
              </td>
              <td className="px-4 py-3 align-top leading-6 text-stone-300">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {caption ? (
        <p className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5 text-xs leading-5 text-stone-500">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/* ─── Inline bits ─────────────────────────────────────────────────── */

export function Pill({
  children,
  icon,
}: {
  children: ReactNode;
  icon?: DocsIcon;
}) {
  const Icon = icon;
  return (
    <span className="mono inline-flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 align-middle text-xs text-stone-300">
      {Icon ? <Icon size={12} /> : null}
      {children}
    </span>
  );
}

/** Keyboard combo rendered with the landing's `.keycap` styling. */
export function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      {keys.map((key, index) => (
        <span key={`${key}-${index}`} className="inline-flex items-center gap-1">
          {index > 0 ? (
            <span className="text-[11px] text-stone-600">+</span>
          ) : null}
          <kbd className="keycap">{key}</kbd>
        </span>
      ))}
    </span>
  );
}
