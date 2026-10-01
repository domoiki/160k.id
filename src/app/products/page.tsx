import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/sections/PageHero";
import { products } from "@/lib/content";

export const metadata: Metadata = {
  title: "Products",
  description:
    "160K communication products: A2P messaging, OTP solutions, location based advertising, targeted SMS, contextual communication and roaming SIM cards.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Products", href: "/products" }]}
        title="Six capabilities, one gateway."
        lede="Every product below runs on the same 160K infrastructure and is reached through the same interface. Adopt one channel or several — the integration work is the same either way."
      />

      <section className="pb-24 md:pb-32">
        <div className="shell">
          <ul className="border-t border-l border-line">
            {products.map((p) => (
              <li key={p.slug} className="border-r border-b border-line">
                <Link
                  href={p.href}
                  className="group grid items-center gap-6 p-6 transition-colors duration-300 hover:bg-white/[0.02] md:grid-cols-12 md:gap-8 md:p-8"
                >
                  <div className="md:col-span-4">
                    <div className="relative h-36 w-full overflow-hidden rounded-[6px] border border-line bg-abyss/70 md:h-40">
                      <Image
                        src={p.image}
                        alt={p.imageAlt}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-contain p-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-8">
                    <h2 className="text-h3 font-semibold text-ink">{p.name}</h2>
                    <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink-dim">
                      {p.summary}
                    </p>
                    <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2">
                      {p.meta.map((m) => (
                        <div key={m.label} className="flex items-baseline gap-2">
                          <dt className="font-mono text-[12px] tracking-[0.1em] text-faint uppercase">
                            {m.label}
                          </dt>
                          <dd className="font-mono text-[12px] text-ink-dim">{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <span className="flex items-center gap-1.5 text-sm text-ink-dim transition-colors duration-200 group-hover:text-brand md:col-span-12 md:justify-end">
                    Learn more
                    <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden
                         className="transition-transform duration-300 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                      <path d="M0 4.5h11M7.5 1l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.3"
                            strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
