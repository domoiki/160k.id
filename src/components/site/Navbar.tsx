"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { nav } from "@/lib/content";
import { cn } from "@/lib/cn";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Scroll state: background opacity + blur only after the hero starts moving. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close everything on navigation. Adjusted during render rather than in an
     effect — React's documented pattern for resetting state when a value
     changes, and it avoids a cascading render after paint. */
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMobileOpen(false);
    setOpenMenu(null);
  }

  /* Escape closes, and the page behind the sheet stops scrolling. */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

  const scheduleClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300 ease-[var(--ease-out-expo)]",
        scrolled || mobileOpen
          ? "border-b border-line bg-void/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="shell flex h-16 items-center justify-between gap-6 md:h-[4.5rem]">
        <Logo priority />

        {/* ---------- desktop ---------- */}
        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => { cancelClose(); setOpenMenu(item.label); }}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === item.label}
                  aria-haspopup="true"
                  onClick={() =>
                    setOpenMenu((v) => (v === item.label ? null : item.label))
                  }
                  onFocus={() => { cancelClose(); setOpenMenu(item.label); }}
                  className={cn(
                    "flex h-9 items-center gap-1.5 rounded-[2px] px-3 text-sm transition-colors duration-200",
                    openMenu === item.label || isActive(item.href)
                      ? "text-ink"
                      : "text-ink-dim hover:text-ink",
                  )}
                >
                  {item.label}
                  <svg
                    width="9"
                    height="6"
                    viewBox="0 0 9 6"
                    fill="none"
                    aria-hidden
                    className={cn(
                      "text-faint transition-transform duration-200",
                      openMenu === item.label && "rotate-180",
                    )}
                  >
                    <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </button>

                {openMenu === item.label ? (
                  <div className="absolute top-[calc(100%+0.75rem)] left-1/2 w-[30rem] -translate-x-1/2 pt-3">
                    <div className="xk-panel overflow-hidden p-1.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="group flex items-center justify-between gap-4 rounded-[2px] px-3.5 py-2.5 transition-colors duration-150 hover:bg-white/[0.045]"
                        >
                          <span className="text-sm text-ink">{child.label}</span>
                          <span className="text-xs text-faint transition-colors group-hover:text-muted">
                            {child.note}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-9 items-center rounded-[2px] px-3 text-sm transition-colors duration-200",
                  isActive(item.href) ? "text-ink" : "text-ink-dim hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/contact" size="sm">
            Contact us
          </ButtonLink>
        </div>

        {/* ---------- mobile toggle ---------- */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="relative -mr-2 flex h-10 w-10 items-center justify-center rounded-[2px] text-ink transition-colors hover:bg-white/5 lg:hidden"
        >
          <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          <span aria-hidden className="relative block h-3 w-[18px]">
            <span
              className={cn(
                "absolute left-0 block h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                mobileOpen ? "top-1.5 rotate-45" : "top-0",
              )}
            />
            <span
              className={cn(
                "absolute top-1.5 left-0 block h-px w-full bg-current transition-opacity duration-200",
                mobileOpen && "opacity-0",
              )}
            />
            <span
              className={cn(
                "absolute left-0 block h-px w-full bg-current transition-transform duration-300 ease-[var(--ease-out-expo)]",
                mobileOpen ? "top-1.5 -rotate-45" : "top-3",
              )}
            />
          </span>
        </button>
      </div>

      {/* ---------- mobile sheet ---------- */}
      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden border-line transition-[max-height,opacity] duration-400 ease-[var(--ease-out-expo)] lg:hidden",
          mobileOpen
            ? "max-h-[calc(100dvh-4rem)] border-t opacity-100"
            : "max-h-0 opacity-0",
        )}
      >
        <nav aria-label="Mobile" className="shell flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto pt-4 pb-8">
          {nav.map((item) => (
            <div key={item.label} className="border-b border-line pb-3 last:border-0">
              {item.children ? (
                <>
                  <p className="px-1 pt-2 pb-1 font-mono text-[0.6875rem] tracking-[0.14em] text-faint uppercase">
                    {item.label}
                  </p>
                  <div className="grid gap-0.5">
                    {item.children.map((c) => (
                      <Link
                        key={c.href}
                        href={c.href}
                        className={cn(
                          "rounded-[2px] px-1 py-2.5 text-[0.9375rem] transition-colors",
                          pathname === c.href ? "text-brand" : "text-ink",
                        )}
                      >
                        {c.label}
                        <span className="mt-0.5 block text-xs text-faint">{c.note}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-[2px] px-1 py-3 text-lg tracking-[-0.01em]",
                    isActive(item.href) ? "text-brand" : "text-ink",
                  )}
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <ButtonLink href="/contact" size="lg" className="mt-5 w-full">
            Contact us
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
