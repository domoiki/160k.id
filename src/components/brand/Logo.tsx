import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * 160K logo lockup.
 *
 * The published lockup is a red mark plus a BLACK wordmark lockup — black
 * vanishes on a near-black surface, so the mark alone is used and the wordmark
 * is set as live text beside it. The red mark itself is untouched, so the
 * brand is preserved rather than recoloured.
 */
export function Logo({
  className,
  markClassName,
  showWordmark = true,
  priority = false,
}: {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      /* py-2 with -my-2: the lockup renders at 28px, which is a thin target on
         touch. The negative margin grows the hit area to 44px without moving
         the mark a single pixel or disturbing the surrounding layout. */
      className={cn("group inline-flex items-center gap-2.5 py-2 -my-2", className)}
      aria-label="160K — home"
    >
      <Image
        src="/assets/brand/logo-mark.webp"
        alt="160K"
        width={240}
        height={239}
        priority={priority}
        className={cn("h-7 w-auto shrink-0", markClassName)}
      />
      {showWordmark ? (
        <span className="text-[1.0625rem] leading-none font-semibold tracking-[-0.02em] text-ink">
          160<span className="text-brand">K</span>
        </span>
      ) : null}
    </Link>
  );
}
