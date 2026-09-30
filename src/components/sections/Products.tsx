import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { products } from "@/lib/content";

/**
 * Product matrix.
 *
 * A bordered spec matrix with hairline dividers rather than a set of identical
 * rounded cards — the products are peers in one system, not separate widgets.
 */
export function Products() {
  return (
    <section id="products" className="relative py-24 md:py-32">
      <div className="shell">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            rail={`${String(products.length).padStart(2, "0")} capabilities`}
            title="Communication solutions built for scale."
            className="md:max-w-[54%]"
          />
          <p className="max-w-[46ch] text-ink-dim md:pb-2">
            Each product runs on the same gateway, reached through the same
            interface. Start with one channel, or run several against a single
            integration.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-1 border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.slug} className="group relative border-r border-b border-line">
              <Link href={p.href} className="flex h-full flex-col p-6 md:p-7">
                {/* image plate: fixed frame so mixed source ratios stay aligned */}
                <div className="relative mb-6 h-40 w-full overflow-hidden rounded-[6px] border border-line bg-abyss/70 transition-colors duration-300 group-hover:border-line-strong md:h-44">
                  <div
                    aria-hidden
                    className="xk-plate-glow absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <Image
                    src={p.image}
                    alt={p.imageAlt}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain p-5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                  />
                </div>

                <h3 className="text-h3 font-semibold text-ink">{p.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-dim">{p.summary}</p>

                {/* technical metadata */}
                <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-line pt-4">
                  {p.meta.map((m) => (
                    <div key={m.label} className="min-w-0">
                      <dt className="truncate font-mono text-[9px] tracking-[0.1em] text-faint uppercase">
                        {m.label}
                      </dt>
                      <dd className="mt-1.5 truncate font-mono text-[11px] text-ink-dim">{m.value}</dd>
                    </div>
                  ))}
                </dl>

                <span className="mt-6 inline-flex items-center gap-1.5 text-sm text-ink-dim transition-colors duration-200 group-hover:text-brand">
                  Learn more
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden
                       className="transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                    <path d="M0 4.5h11M7.5 1l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.3"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>

                {/* hover edge */}
                <span aria-hidden
                      className="absolute inset-x-0 top-0 h-px scale-x-0 bg-brand transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
