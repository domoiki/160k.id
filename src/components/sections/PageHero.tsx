import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared hero for interior pages. Keeps the same atmosphere as the home hero
 * but at a calmer scale, so the page transition feels continuous.
 */
export function PageHero({
  breadcrumb,
  title,
  lede,
  aside,
  children,
}: {
  breadcrumb: { label: string; href: string }[];
  title: ReactNode;
  lede?: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-14 md:pt-36 md:pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="xk-grid xk-grid-fade absolute inset-0 opacity-40" />
        <div className="absolute top-[-20%] right-[-10%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(76,141,255,0.09),transparent_65%)] blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="shell">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-faint">
            {breadcrumb.map((b, i) => (
              <li key={b.href} className="flex items-center gap-2">
                {i > 0 ? <span aria-hidden>/</span> : null}
                {i === breadcrumb.length - 1 ? (
                  <span aria-current="page" className="text-ink-dim">
                    {b.label}
                  </span>
                ) : (
                  <Link href={b.href} className="transition-colors hover:text-ink-dim">
                    {b.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className={cn("grid gap-10", aside ? "lg:grid-cols-12 lg:gap-10" : "")}>
          <div className={cn("max-w-[60ch]", aside && "lg:col-span-6")}>
            <h1 className="text-[clamp(2.1rem,1.4rem+3vw,3.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-ink">
              {title}
            </h1>
            {lede ? <p className="mt-7 text-lede text-ink-dim">{lede}</p> : null}
            {children ? <div className="mt-9">{children}</div> : null}
          </div>
          {aside ? <div className="lg:col-span-6">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}
