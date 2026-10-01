"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { nav } from "@/lib/content";
import { cn } from "@/lib/cn";

/* Grace period before a hovered flyout closes.

   The trigger and the panel are 12px apart, and crossing that gap fires
   `mouseleave` — measured: leave at 5ms, closed at 154ms, while the pointer
   needed longer than that to arrive. A pointer crossing a visible gap needs
   roughly 200ms; anything less closes the menu mid-gesture, so the user sees it
   vanish before they can click. 320ms is the usual figure for a flyout that
   must survive the trip; it costs nothing when they genuinely leave, because
   nothing is visible while they are on their way to somewhere else. */
const CLOSE_GRACE_MS = 320;

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
      closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_GRACE_MS);
    }, []);

    const cancelClose = useCallback(() => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    }, []);

  /* Escape and pointer-focus both close the menu, and focus has to be able to
     land on the trigger again afterwards without that immediately reopening
     it. One flag absorbs that round trip. */
  const suppressFocusOpen = useRef(false);

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
          {nav.map((item) => {
            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-10 items-center rounded-[2px] px-3 text-sm transition-colors duration-200",
                    isActive(item.href) ? "text-ink" : "text-ink-dim hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              );
            }

            const open = openMenu === item.label;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseLeave={scheduleClose}
                onBlur={(e) => {
                  /* Focus left the whole widget rather than moving between the
                     trigger and the panel it owns. Without this, tabbing past an
                     open menu left it open over unrelated content. */
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setOpenMenu(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key !== "Escape") return;
                  setOpenMenu(null);
                  /* Send focus back to the trigger rather than dropping it on
                     <body>, which strands keyboard users mid-page. */
                  suppressFocusOpen.current = true;
                  (e.currentTarget.querySelector("a") as HTMLAnchorElement | null)?.focus();
                }}
              >
                {/* The trigger is a real link to /products, and hover opens the
                    flyout alongside it.

                    It used to be a <button> that toggled, which could never
                    appear to work. A pointer click focuses a button on
                    mousedown, so onFocus opened the flyout and the click that
                    followed toggled it straight back shut — open and shut inside
                    one gesture. Once hover was taken into account the same
                    conflict showed up differently: hover opened it, then the
                    click closed it. Both are one bug — a toggle fighting a menu
                    that something else had already opened — and neither ordering
                    fixes it. A link cannot cancel what hovering did, so the
                    conflict is gone rather than reordered.

                    Touch is unaffected either way: this nav is lg:flex, and
                    mobile has its own sheet listing every child explicitly. */}
                <Link
                  href={item.href}
                  aria-expanded={open}
                  onMouseEnter={() => { cancelClose(); setOpenMenu(item.label); }}
                  onFocus={(e) => {
                    /* Only keyboard focus opens it. :focus-visible is the
                       browser's own answer to "was this keyboard focus", so it
                       separates the two paths without tracking pointers. */
                    if (suppressFocusOpen.current) {
                      suppressFocusOpen.current = false;
                      return;
                    }
                    if (e.target.matches(":focus-visible")) {
                      cancelClose();
                      setOpenMenu(item.label);
                    }
                  }}
                  className={cn(
                    "flex h-10 items-center gap-1.5 rounded-[2px] px-3 text-sm transition-colors duration-200",
                    open || isActive(item.href) ? "text-ink" : "text-ink-dim hover:text-ink",
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
                      open && "rotate-180",
                    )}
                  >
                    <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                </Link>

                {open ? (
                  /* `absolute top-full`, with the 12px offset moved from `top` into
                     `padding-top`. The band between the trigger and the panel now
                     belongs to the hover target instead of belonging to neither
                     element. Measured before this change: `mouseleave` fired at 5ms
                     and the flyout closed at 154ms, while the pointer needed longer
                     than that to cross — so the menu always vanished mid-gesture.

                     Still `w-[30rem]` and still centred on the trigger, so the panel
                     renders in exactly the same place. The 12px is padding now, not
                     dead space. `onMouseEnter` re-cancels the close if the pointer
                     arrives after the timer was armed. */
                  <div
                    className="absolute left-1/2 top-full w-[30rem] -translate-x-1/2 pt-3"
                    onMouseEnter={cancelClose}
                  >
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
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/contact" size="md">
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
          className="relative -mr-2 flex h-11 w-11 items-center justify-center rounded-[2px] text-ink transition-colors hover:bg-white/5 lg:hidden"
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
      {/* `inert` while collapsed. Without it the eleven links inside are still
          in the tab order and still exposed to assistive tech even though the
          sheet is clipped to zero height — keyboard users tab into a menu they
          cannot see, and screen readers announce links that are not on screen.
          It also stops them being reached by browser find-on-page. */}
      <div
        id="mobile-nav"
        inert={!mobileOpen}
        className={cn(
          "overflow-hidden border-line transition-[max-height,opacity] duration-400 ease-[var(--ease-out-expo)] lg:hidden",
          mobileOpen
            ? "max-h-[calc(100dvh-4rem)] border-t opacity-100"
            : "max-h-0 opacity-0",
        )}
      >
        {/* `shrink-0` on every child. The nav is a height-capped flex column
            (max-h-[calc(100dvh-4rem)]) whose content overflows it, and flex
            items shrink by default — which silently squashed the primary CTA
            from its declared h-12 down to 24px. The cap should scroll, not
            compress. */}
        <nav aria-label="Mobile" className="shell flex max-h-[calc(100dvh-4rem)] flex-col gap-1 overflow-y-auto pt-4 pb-8">
          {nav.map((item) => (
            <div key={item.label} className="shrink-0 border-b border-line pb-3 last:border-0">
              {item.children ? (
                <>
                  <p className="px-1 pt-2 pb-1 font-mono text-[12px] tracking-[0.14em] text-faint uppercase">
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
          <ButtonLink href="/contact" size="lg" className="mt-5 w-full shrink-0">
            Contact us
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
