import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Section header.
 *
 * Deliberately NOT the generic "tracked-out ALL-CAPS eyebrow above a heading"
 * pattern. The optional rail sits in the left margin as a mono technical
 * marker and is only used where it carries real information
 * (a protocol version, a founding year, a count) — never as decoration.
 */
export function SectionHeader({
  rail,
  title,
  lede,
  align = "left",
  className,
}: {
  rail?: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <header className={cn(align === "center" && "flex flex-col items-center text-center", className)}>
      {rail ? (
        <div className="mb-5 flex items-center gap-3 font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
          <span aria-hidden className="inline-block h-px w-6 bg-brand" />
          <span>{rail}</span>
        </div>
      ) : null}
      <h2
        className={cn(
          "max-w-[18ch] text-h2 font-semibold text-ink",
          align === "center" && "max-w-[22ch]",
        )}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={cn(
            "mt-6 max-w-[62ch] text-lede text-ink-dim",
            align === "center" && "mx-auto",
          )}
        >
          {lede}
        </p>
      ) : null}
    </header>
  );
}
