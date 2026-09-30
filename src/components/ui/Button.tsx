import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "quiet";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-[2px] font-medium " +
  "transition-[background-color,border-color,color,box-shadow,transform] duration-200 " +
  "ease-[var(--ease-out-expo)] whitespace-nowrap select-none";

const variants: Record<Variant, string> = {
  // Fills use --color-brand-solid: pure brand red only reaches 3.73:1 against
  // white text, which fails AA. The deeper fill clears it at 5.04:1.
  primary:
    "bg-brand-solid text-white shadow-[0_1px_0_rgba(255,255,255,0.14)_inset,0_8px_24px_-12px_rgba(217,31,31,0.9)] " +
    "hover:bg-brand-solid-hover hover:shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_12px_32px_-10px_rgba(217,31,31,1)] active:translate-y-px",
  secondary:
    "border border-line-strong bg-white/[0.02] text-ink hover:bg-white/[0.06] hover:border-white/25 active:translate-y-px",
  quiet: "text-ink-dim hover:text-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[0.8125rem]",
  md: "h-10 px-5 text-[0.9375rem]",
  lg: "h-12 px-6 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({
  href,
  external,
  variant = "primary",
  size = "md",
  className,
  children,
}: CommonProps & { href: string; external?: boolean }) {
  const cls = cn(base, variants[variant], sizes[size], className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noreferrer noopener">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}
