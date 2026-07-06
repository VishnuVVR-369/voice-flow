"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { CopyIcon, CheckIcon, TerminalIcon } from "./icons";

type CodeBlockProps = {
  children: string;
  title?: string;
  language?: string;
};

export function CodeBlock({ children, title, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure context); fail silently.
    }
  }

  const label = title ?? language;

  return (
    <div className="group/code relative mt-5 overflow-hidden rounded-xl border border-white/[0.08] bg-black/50">
      <div className="flex items-center justify-between border-b border-white/[0.06] py-2 pr-2 pl-3.5">
        <span className="mono flex items-center gap-2 text-[11px] tracking-[0.04em] text-stone-500">
          <TerminalIcon size={13} />
          {label ?? "Shell"}
        </span>
        <button
          aria-label={copied ? "Copied" : "Copy code"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            copied
              ? "text-emerald-300"
              : "text-stone-500 hover:bg-white/[0.06] hover:text-stone-200",
          )}
          onClick={handleCopy}
          type="button"
        >
          {copied ? <CheckIcon size={13} /> : <CopyIcon size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mono overflow-x-auto p-4 text-[12.5px] leading-6 text-stone-300">
        <code>{children}</code>
      </pre>
    </div>
  );
}
