"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { ArrowRightIcon, SearchIcon } from "./icons";

type DocsSearchItem = {
  title: string;
  description: string;
  group: string;
  href: string;
  searchText: string;
};

type CommandMenuProps = {
  items: DocsSearchItem[];
  className?: string;
};

export function CommandMenu({ items, className }: CommandMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRef = useRef(false);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) {
      return items;
    }
    return items.filter((item) =>
      item.searchText.toLowerCase().includes(value),
    );
  }, [items, query]);

  const setOpenState = useCallback((next: boolean) => {
    openRef.current = next;
    if (next) {
      setQuery("");
      setActiveIndex(0);
    }
    setOpen(next);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpenState(!openRef.current);
      } else if (event.key === "Escape" && openRef.current) {
        setOpenState(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpenState]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const navigate = useCallback(
    (href: string) => {
      setOpenState(false);
      router.push(href);
    },
    [router, setOpenState],
  );

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex];
      if (target) {
        navigate(target.href);
      }
    }
  }

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <>
      <button
        className={cn(
          "flex h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-sm text-stone-500 backdrop-blur-md transition-colors hover:border-white/[0.16] hover:text-stone-300",
          className,
        )}
        type="button"
        onClick={() => setOpenState(true)}
      >
        <SearchIcon size={16} />
        <span className="flex-1 text-left">Search docs</span>
        <kbd className="mono hidden items-center gap-0.5 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[0.65rem] text-stone-500 sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <button
              aria-label="Close search"
              className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
              onClick={() => setOpenState(false)}
              type="button"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Search documentation"
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c0c0c] shadow-[0_32px_120px_-24px_rgba(0,0,0,0.95)]"
              initial={{ opacity: 0, scale: 0.97, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex h-12 items-center gap-3 border-b border-white/[0.08] px-4 text-stone-400">
                <SearchIcon size={18} />
                <input
                  ref={inputRef}
                  className="h-full flex-1 bg-transparent text-sm text-stone-100 outline-none placeholder:text-stone-600"
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onInputKeyDown}
                  placeholder="Search documentation…"
                  value={query}
                />
                <kbd className="mono rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[0.65rem] text-stone-500">
                  Esc
                </kbd>
              </div>

              <div
                className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5"
                ref={listRef}
              >
                {results.length > 0 ? (
                  results.map((item, index) => (
                    <button
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        index === activeIndex
                          ? "bg-amber-400/[0.1]"
                          : "hover:bg-white/[0.05]",
                      )}
                      data-index={index}
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setActiveIndex(index)}
                      type="button"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="mono block text-[0.65rem] tracking-[0.1em] text-amber-300/70 uppercase">
                          {item.group}
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-medium text-stone-100">
                          {item.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-stone-500">
                          {item.description}
                        </span>
                      </span>
                      <ArrowRightIcon
                        size={16}
                        className={cn(
                          "shrink-0 transition-colors",
                          index === activeIndex
                            ? "text-amber-300"
                            : "text-stone-700",
                        )}
                      />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm text-stone-500">
                    No results for “{query}”.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
