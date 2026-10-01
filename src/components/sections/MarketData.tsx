import Image from "next/image";
import { marketData } from "@/lib/content";

/**
 * Indonesian mobile market, as published on 160k.co.id.
 *
 * Included because it is the one piece of scale evidence the company actually
 * publishes. Attributed on the page so the figures are never read as a fresh
 * 160K measurement.
 */
export function MarketData() {
  const max = Math.max(
    ...marketData.operators.map((o) => Number(o.subscribers.replace(/\D/g, ""))),
  );

  return (
    <section aria-labelledby="market-heading" className="relative border-t border-line py-20 md:py-24">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2
              id="market-heading"
              className="text-h3 font-semibold text-ink lg:text-[1.75rem] lg:leading-[1.15]"
            >
              The market this infrastructure serves
            </h2>
            <p className="mt-5 max-w-[42ch] text-sm leading-relaxed text-ink-dim">
              Household cellular penetration in Indonesia, and cellular
              subscribers by operator, as published on 160k.co.id.
            </p>

            <div className="mt-8 flex gap-8 border-t border-line pt-6">
              {marketData.penetration.map((p) => (
                <div key={p.year}>
                  <p className="font-mono text-[12px] tracking-[0.12em] text-faint uppercase">{p.year}</p>
                  <p className="mt-1.5 text-2xl font-semibold tracking-[-0.02em] text-ink tabular-nums">
                    {p.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8">
            <ul className="border-t border-line">
              {marketData.operators.map((o) => {
                const n = Number(o.subscribers.replace(/\D/g, ""));
                return (
                  <li
                    key={o.name}
                    className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-line py-3.5 sm:grid-cols-[9.5rem_1fr_5.5rem]"
                  >
                    <span className="flex items-center gap-2.5">
                      <Image
                        src={o.image}
                        alt=""
                        aria-hidden
                        width={22}
                        height={22}
                        loading="lazy"
                        className="h-5 w-auto max-w-6 object-contain opacity-55 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                      />
                      <span className="text-sm text-ink-dim transition-colors duration-200 group-hover:text-ink">
                        {o.name}
                      </span>
                    </span>
                    <span aria-hidden className="col-span-2 h-1 overflow-hidden rounded-full bg-white/[0.05] sm:col-span-1">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-infra-deep to-infra transition-transform duration-700 ease-[var(--ease-out-expo)] origin-left"
                        style={{ width: `${(n / max) * 100}%` }}
                      />
                    </span>
                    <span className="text-right font-mono text-xs text-ink tabular-nums">{o.subscribers}</span>
                  </li>
                );
              })}
              <li className="flex items-center justify-between pt-4">
                <span className="font-mono text-[12px] tracking-[0.12em] text-faint uppercase">Total</span>
                <span className="font-mono text-sm font-medium text-brand tabular-nums">
                  {marketData.total}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
