import { ButtonLink } from "@/components/ui/Button";
import { SmppTranscript } from "@/components/visual/SmppTranscript";
import { site } from "@/lib/content";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24 lg:pt-44">
      {/* atmosphere: slow grid + a single cool glow behind the panel */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="xk-grid xk-grid-fade xk-animate-drift absolute inset-0 opacity-[0.55]" />
        <div className="absolute top-[-10%] right-[-15%] h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle,rgba(76,141,255,0.11),transparent_62%)] blur-2xl" />
        <div className="absolute bottom-[-30%] left-[-12%] h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(255,43,43,0.07),transparent_65%)] blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
      </div>

      <div className="shell">
        {/* min-w-0 on both children: a grid item defaults to min-width:auto,
            which resolves to its own min-content width and would let either
            column push past its track. Combined with the narrow display scale
            at `lg`, that keeps the headline inside the copy column. */}
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* ---- copy ---- */}
          <div className="min-w-0 lg:col-span-6">
            <p className="mb-6 flex items-center gap-3 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">
              <span aria-hidden className="relative flex h-1.5 w-1.5">
                <span className="xk-animate-pulse absolute inline-flex h-full w-full rounded-full bg-brand" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
              </span>
              Cloud communication provider
            </p>

            {/* text-display full-bleed while stacked; the narrow variant once the
                panel sits beside it.

                Deliberately no overflow-wrap/break-words here. It would stop
                the overlap by breaking "Communication" mid-word, and it would
                also stop TEXT-SPILL in audit-ui.mjs from ever seeing this
                element — turning the guard into a blind spot on exactly the
                heading it exists to protect. A headline that fits is better
                than one that is allowed to break. */}
            <h1 className="text-display font-semibold text-ink lg:text-display-narrow">
              Communication infrastructure for{" "}
              <span className="text-ink-dim">modern businesses.</span>
            </h1>

            <p className="mt-7 max-w-[54ch] text-lede text-ink-dim">
              160K is a cloud service provider for A2P messaging, OTP solutions,
              contextual communication technology and international prepaid SIM
              cards. Incorporated in Indonesia in {site.founded}.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href="/products" size="lg">
                Explore solutions
              </ButtonLink>
              <ButtonLink href="/contact" variant="secondary" size="lg">
                Contact us
              </ButtonLink>
            </div>
          </div>

          {/* ---- technical panel ---- */}
          <div className="relative min-w-0 lg:col-span-6 lg:pl-2">
            {/* the signal thread: leaves the panel and descends the page */}
            <div aria-hidden className="absolute top-1/2 -right-3 hidden h-[calc(100%+8rem)] w-px bg-gradient-to-b from-transparent via-line-strong to-transparent xl:block" />
            <SmppTranscript className="xk-rise" />
            <p className="mt-4 max-w-[62ch] font-mono text-[12px] leading-relaxed text-faint">
              A representative SMPP v3.4 exchange. Field names and values follow
              160K&rsquo;s published interface specification.
            </p>
          </div>
        </div>

        {/* ---- factual rail ---- */}
        <div className="mt-16 border-t border-line pt-6 md:mt-20">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            {[
              { k: "Legal entity", v: site.shortLegalName },
              { k: "Incorporated", v: site.founded },
              { k: "Base", v: "Jakarta, Indonesia" },
              { k: "Interface", v: "SMPP v3.4" },
            ].map((f) => (
              <div key={f.k}>
                <dt className="font-mono text-[12px] tracking-[0.12em] text-faint uppercase">{f.k}</dt>
                <dd className="mt-1.5 text-sm text-ink-dim">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
