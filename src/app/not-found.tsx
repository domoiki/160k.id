import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[70vh] items-center overflow-hidden pt-28 pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="xk-grid xk-grid-fade absolute inset-0 opacity-40" />
      </div>
      <div className="shell">
        <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
          Error 404
        </p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.1rem,1.4rem+3vw,3.5rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-ink">
          That route doesn&rsquo;t reach anything.
        </h1>
        <p className="mt-6 max-w-[46ch] text-lede text-ink-dim">
          The page you asked for isn&rsquo;t here. The products, the interface
          specification and contact details all are.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" size="lg">
            Back to home
          </ButtonLink>
          <ButtonLink href="/products" variant="secondary" size="lg">
            Browse products
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
