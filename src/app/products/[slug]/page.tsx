import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FinalCta } from "@/components/sections/FinalCta";
import { MarketData } from "@/components/sections/MarketData";
import { PageHero } from "@/components/sections/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { productDetails, products, smpp } from "@/lib/content";

type Params = { slug: string };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) return {};
  const detail = productDetails[slug];
  return {
    title: product.name,
    description: detail?.intro ?? product.summary,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: `${product.name} — 160K`,
      description: detail?.intro ?? product.summary,
      url: `/products/${slug}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  const detail = productDetails[slug];
  const example = detail?.example;
  const gallery = detail?.gallery;
  const others = products.filter((p) => p.slug !== slug);

  return (
    <>
      <PageHero
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Products", href: "/products" },
          { label: product.name, href: product.href },
        ]}
        title={detail?.headline ?? product.name}
        lede={detail?.intro}
        aside={
          <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-panel)] border border-line bg-abyss/70">
            <div aria-hidden className="xk-plate-glow absolute inset-0" />
            <Image
              src={product.image}
              alt={product.imageAlt}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 46vw"
              className="object-contain p-8"
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/contact" size="lg">
            Talk to us
          </ButtonLink>
          <ButtonLink href="/api" variant="secondary" size="lg">
            See the interface
          </ButtonLink>
        </div>
      </PageHero>

      {/* ---- specification strip ---- */}
      <section aria-label="Specification" className="border-y border-line bg-abyss/50">
        <div className="shell">
          <dl className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-y-0">
            {product.meta.map((m, i) => (
              <div
                key={m.label}
                className={`py-5 sm:px-6 ${i > 0 ? "sm:border-l sm:border-line" : ""} ${
                  i === 0 ? "sm:pl-0" : ""
                }`}
              >
                <dt className="font-mono text-[12px] tracking-[0.12em] text-faint uppercase">
                  {m.label}
                </dt>
                <dd className="mt-2 font-mono text-sm text-ink">{m.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---- detail ---- */}
      {detail?.points?.length ? (
        <section className="py-20 md:py-28">
          <div className="shell">
            <h2 className="max-w-[20ch] text-h3 font-semibold text-ink md:text-[2rem]">
              How it works
            </h2>
            <ul className="mt-12 grid border-t border-l border-line md:grid-cols-2">
              {detail.points.map((p) => (
                <li
                  key={p.title}
                  className="border-r border-b border-line p-7 transition-colors duration-300 hover:bg-white/[0.02] md:p-8"
                >
                  <h3 className="text-base font-medium text-ink">{p.title}</h3>
                  <p className="mt-3 max-w-[46ch] text-sm leading-relaxed text-ink-dim">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* ---- worked example ---- */}
      {example ? (
        <section className="pb-20 md:pb-28">
          <div className="shell">
            <p className="mb-5 font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
              Worked example — {example.label}
            </p>
            <div className="max-w-md rounded-[var(--radius-panel)] border border-line bg-surface p-6">
              <div className="space-y-2">
                {example.lines.map((l, i) => (
                  <p
                    key={l}
                    className={`font-mono text-lg tabular-nums ${
                      i === example.lines.length - 1 ? "text-ink" : "text-ink-dim"
                    }`}
                  >
                    {l}
                  </p>
                ))}
              </div>
              {example.note ? (
                <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-faint">
                  {example.note}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {/* ---- gallery ---- */}
      {gallery?.length ? (
        <section className="pb-20 md:pb-28">
          <div className="shell">
            <div className="grid gap-5 sm:grid-cols-2">
              {gallery.map((g) => (
                <figure
                  key={g.src}
                  className="overflow-hidden rounded-[var(--radius-panel)] border border-line bg-abyss/60"
                >
                  <div className="relative aspect-4/3">
                    <Image
                      src={g.src}
                      alt={g.alt}
                      fill
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-contain p-4"
                    />
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {detail?.showMarketData ? <MarketData /> : null}

      {/* ---- interface link ---- */}
      <section className="border-t border-line py-20 md:py-24">
        <div className="shell">
          <div className="flex flex-col gap-6 rounded-[var(--radius-panel)] border border-line bg-surface p-7 md:flex-row md:items-center md:justify-between md:p-9">
            <div className="max-w-[52ch]">
              <p className="font-mono text-[12px] tracking-[0.16em] text-infra uppercase">
                SMPP v{smpp.version}
              </p>
              <h2 className="mt-3 text-h3 font-semibold text-ink">
                Every product is reached through one standard interface.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                {smpp.title}, revision {smpp.revision}. Your ESME connects once and
                every channel is reachable from it.
              </p>
            </div>
            <ButtonLink href="/api" variant="secondary" className="shrink-0">
              Read the specification
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ---- other capabilities ---- */}
      <section aria-labelledby="others-heading" className="border-t border-line py-20 md:py-24">
        <div className="shell">
          <h2 id="others-heading" className="font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
            Other capabilities
          </h2>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {others.map((o) => (
              <li key={o.slug}>
                <Link
                  href={o.href}
                  className="inline-flex items-center gap-2 rounded-[var(--radius-panel)] border border-line bg-surface px-4 py-2.5 text-sm text-ink-dim transition-colors duration-200 hover:border-line-strong hover:bg-white/[0.03] hover:text-ink"
                >
                  {o.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
