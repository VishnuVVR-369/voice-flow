import Link from "next/link";
import { Logo } from "@/components/Logo";
import { CommandMenu } from "@/components/docs/CommandMenu";
import { Reveal } from "@/components/docs/Reveal";
import { TableOfContents } from "@/components/docs/TableOfContents";
import { ArrowLeftIcon, ArrowRightIcon, HashIcon } from "@/components/docs/icons";
import { cn } from "@/lib/cn";
import { DOWNLOAD_URL } from "@/lib/download";
import {
  docsGroups,
  docsSearchItems,
  getDocsPath,
  type DocsPage,
} from "@/lib/docs";

type DocsShellProps = {
  page: DocsPage;
  previous?: DocsPage;
  next?: DocsPage;
};

export function DocsShell({ page, previous, next }: DocsShellProps) {
  return (
    <main className="min-h-screen text-stone-100 selection:bg-amber-500/30 selection:text-amber-200">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-gridlines opacity-[0.35]"
      />

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#070707]/70 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-4">
          <Link href="/" aria-label="VoiceFlow home" className="shrink-0">
            <Logo size={26} />
          </Link>
          <div className="hidden h-5 w-px bg-white/[0.08] md:block" />
          <Link
            className="mono hidden rounded-md px-2 py-1 text-[12px] tracking-[0.08em] text-stone-400 uppercase transition-colors hover:text-stone-100 md:block"
            href="/docs"
          >
            Docs
          </Link>
          <CommandMenu
            className="ml-auto hidden w-full max-w-sm md:flex"
            items={docsSearchItems}
          />
          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            <Link
              href="/"
              className="hidden rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-1.5 text-[13px] font-medium text-stone-400 backdrop-blur-md transition-colors hover:border-white/[0.18] hover:text-stone-100 sm:inline-flex"
            >
              Home
            </Link>
            <a
              href={DOWNLOAD_URL}
              className="btn-primary shine"
              style={{ padding: "9px 18px", fontSize: 13 }}
            >
              Download
            </a>
          </div>
        </div>
        <div className="border-t border-white/[0.06] px-5 py-3 md:hidden">
          <CommandMenu className="w-full" items={docsSearchItems} />
        </div>
      </header>

      <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_14rem]">
        <aside className="hidden lg:block">
          <DocsSidebar currentSlug={page.slug} />
        </aside>

        <div className="min-w-0">
          <MobileDocsNav currentSlug={page.slug} />
          <DocsArticle page={page} />
          <DocsPager next={next} previous={previous} />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <TableOfContents
              sections={page.sections.map((section) => ({
                id: section.id,
                title: section.title,
              }))}
            />
          </div>
        </aside>
      </div>
    </main>
  );
}

function DocsSidebar({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
      <nav className="space-y-7">
        {docsGroups.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.title}>
              <div className="mono mb-2 flex items-center gap-2 px-2 text-[11px] tracking-[0.12em] text-stone-500 uppercase">
                <Icon size={14} />
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.pages.map((item) => {
                  const isActive = item.slug === currentSlug;
                  return (
                    <Link
                      className={cn(
                        "block rounded-lg px-2.5 py-1.5 text-[13.5px] transition-colors",
                        isActive
                          ? "bg-amber-400/[0.09] text-amber-100 ring-1 ring-amber-400/15"
                          : "text-stone-400 hover:bg-white/[0.045] hover:text-stone-100",
                      )}
                      href={getDocsPath(item)}
                      key={item.slug}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </nav>
    </div>
  );
}

function MobileDocsNav({ currentSlug }: { currentSlug: string }) {
  return (
    <div className="mb-6 overflow-x-auto border-b border-white/[0.07] pb-4 lg:hidden">
      <div className="flex min-w-max gap-2">
        {docsGroups.flatMap((group) =>
          group.pages.map((item) => {
            const isActive = item.slug === currentSlug;
            return (
              <Link
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors",
                  isActive
                    ? "border-amber-400/25 bg-amber-400/[0.09] text-amber-100"
                    : "border-white/[0.08] bg-white/[0.035] text-stone-400",
                )}
                href={getDocsPath(item)}
                key={item.slug}
              >
                {item.title}
              </Link>
            );
          }),
        )}
      </div>
    </div>
  );
}

function Breadcrumbs({ page }: { page: DocsPage }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mono mb-5 flex items-center gap-1.5 text-[11px] tracking-[0.04em] text-stone-500"
    >
      <Link className="transition-colors hover:text-stone-300" href="/docs">
        Docs
      </Link>
      <ArrowRightIcon size={12} />
      <span>{page.group}</span>
      <ArrowRightIcon size={12} />
      <span className="text-stone-300">{page.title}</span>
    </nav>
  );
}

function DocsArticle({ page }: { page: DocsPage }) {
  return (
    <article className="mx-auto max-w-3xl">
      <Breadcrumbs page={page} />
      <div className="mb-10 border-b border-white/[0.08] pb-10">
        <div className="eyebrow-chip mb-5">
          <span className="eyebrow-chip__dot" />
          {page.eyebrow}
        </div>
        <h1 className="headline-md text-[clamp(32px,5vw,48px)] text-stone-50">
          {page.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-stone-400">
          {page.description}
        </p>

        {page.quickFacts ? (
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {page.quickFacts.map((fact) => (
              <div
                className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-4"
                key={fact.label}
              >
                <p className="mono text-[11px] tracking-[0.06em] text-stone-500 uppercase">
                  {fact.label}
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-100">
                  {fact.value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {page.highlights ? (
          <div className="mt-7 grid gap-3">
            {page.highlights.map((item) => {
              const content = (
                <>
                  <span>
                    <span className="block text-sm font-semibold text-stone-100">
                      {item.title}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-stone-400">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRightIcon
                    size={16}
                    className="mt-1 shrink-0 text-amber-300"
                  />
                </>
              );

              return item.href ? (
                <Link
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.035] p-4 transition-colors hover:border-amber-400/20 hover:bg-amber-400/[0.055]"
                  href={item.href}
                  key={item.title}
                >
                  {content}
                </Link>
              ) : (
                <div
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/[0.07] bg-white/[0.035] p-4"
                  key={item.title}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="space-y-12">
        {page.sections.map((section) => (
          <section
            className="scroll-mt-24 border-b border-white/[0.06] pb-10 last:border-b-0"
            id={section.id}
            key={section.id}
          >
            <Reveal>
              <a
                className="group flex items-center gap-2 no-underline"
                href={`#${section.id}`}
              >
                <h2 className="text-xl font-semibold tracking-tight text-stone-50">
                  {section.title}
                </h2>
                <HashIcon
                  size={15}
                  className="text-stone-600 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </a>
              <div className="mt-3 text-[15px] leading-7 text-stone-300 [&_a:not(.btn-primary)]:text-amber-200 [&_a:not(.btn-primary)]:underline [&_a:not(.btn-primary)]:decoration-amber-300/25 [&_a:not(.btn-primary)]:underline-offset-4 [&_:not(pre)>code]:mono [&_:not(pre)>code]:rounded-md [&_:not(pre)>code]:bg-white/[0.06] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:text-[13px] [&_:not(pre)>code]:text-amber-100 [&_em]:text-stone-200 [&_em]:not-italic [&_p+p]:mt-4">
                {section.body}
              </div>
            </Reveal>
          </section>
        ))}
      </div>
    </article>
  );
}

function DocsPager({
  previous,
  next,
}: {
  previous?: DocsPage;
  next?: DocsPage;
}) {
  if (!previous && !next) {
    return null;
  }

  return (
    <nav className="mx-auto mt-12 grid max-w-3xl gap-3 border-t border-white/[0.07] pt-8 sm:grid-cols-2">
      {previous ? (
        <Link
          className="group flex items-center gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition-all duration-200 hover:border-amber-400/20 hover:bg-amber-400/[0.05]"
          href={getDocsPath(previous)}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] transition-all duration-200 group-hover:border-amber-400/25 group-hover:bg-amber-400/[0.09]">
            <ArrowLeftIcon
              size={16}
              className="text-stone-500 transition-colors duration-200 group-hover:text-amber-300"
            />
          </div>
          <div className="min-w-0">
            <span className="mono text-[10px] tracking-[0.14em] text-stone-500 uppercase transition-colors duration-200 group-hover:text-amber-400/80">
              Previous
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-stone-300 transition-colors duration-200 group-hover:text-stone-100">
              {previous.title}
            </span>
          </div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          className="group flex items-center justify-end gap-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 text-right transition-all duration-200 hover:border-amber-400/20 hover:bg-amber-400/[0.05]"
          href={getDocsPath(next)}
        >
          <div className="min-w-0">
            <span className="mono text-[10px] tracking-[0.14em] text-stone-500 uppercase transition-colors duration-200 group-hover:text-amber-400/80">
              Next
            </span>
            <span className="mt-0.5 block truncate text-sm font-medium text-stone-300 transition-colors duration-200 group-hover:text-stone-100">
              {next.title}
            </span>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] transition-all duration-200 group-hover:border-amber-400/25 group-hover:bg-amber-400/[0.09]">
            <ArrowRightIcon
              size={16}
              className="text-stone-500 transition-colors duration-200 group-hover:text-amber-300"
            />
          </div>
        </Link>
      ) : null}
    </nav>
  );
}
