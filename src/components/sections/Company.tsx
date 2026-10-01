import Image from "next/image";
import { mission, site, vision } from "@/lib/content";

/**
 * Editorial company section.
 *
 * Copy is the published positioning, tightened. No claim is added that the
 * public site does not already make.
 */
export function Company() {
  return (
    <section id="company" className="relative scroll-mt-24 border-t border-line bg-abyss/40 py-24 md:py-32">
      <div className="shell">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* ---- story ---- */}
          <div className="lg:col-span-6">
            <p className="mb-5 flex items-center gap-3 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">
              <span aria-hidden className="inline-block h-px w-6 bg-brand" />
              The company
            </p>
            <h2 className="text-h2 font-semibold text-ink">
              Communication infrastructure with an Indonesian foundation.
            </h2>
            <div className="mt-8 max-w-[56ch] space-y-5 text-[1.0625rem] leading-relaxed text-ink-dim">
              <p>
                We are a cloud service provider for A2P messaging, OTP solutions,
                contextual communication technology and international prepaid SIM
                cards, incorporated in {site.founded}.
              </p>
              <p>
                We build for enterprises that need to reach customers at scale
                without rebuilding their own telecom stack — and we build it
                here, in Indonesia, for the market we know best.
              </p>
            </div>

            <figure className="mt-10 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
              <div className="relative aspect-4/3">
                <Image
                  src="/assets/company/team-photo.webp"
                  alt="The 160K team at work"
                  fill
                  loading="lazy"
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover opacity-90"
                />
                <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent" />
              </div>
            </figure>
          </div>

          {/* ---- vision & mission ---- */}
          <div className="flex flex-col gap-6 lg:col-span-6 lg:pt-16">
            <blockquote className="relative rounded-[var(--radius-panel)] border border-line bg-surface p-7 md:p-8">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand/70 to-transparent" />
              <p className="font-mono text-[12px] tracking-[0.16em] text-brand uppercase">Our vision</p>
              <p className="mt-5 text-xl leading-[1.35] font-medium tracking-[-0.015em] text-ink md:text-2xl">
                {vision}
              </p>
            </blockquote>

            <blockquote className="relative rounded-[var(--radius-panel)] border border-line bg-surface p-7 md:p-8">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-infra/70 to-transparent" />
              <p className="font-mono text-[12px] tracking-[0.16em] text-infra-bright uppercase">
                Our mission
              </p>
              <p className="mt-5 text-xl leading-[1.35] font-medium tracking-[-0.015em] text-ink md:text-2xl">
                {mission}
              </p>
            </blockquote>

            <div className="rounded-[var(--radius-panel)] border border-line bg-surface/60 p-7 md:p-8">
              <p className="font-mono text-[12px] tracking-[0.16em] text-faint uppercase">Registered entity</p>
              <p className="mt-4 text-base text-ink">{site.legalName}</p>
              <p className="mt-2 text-sm text-ink-dim">
                Jl. Jembatan Tiga Raya, Jakarta Utara 14440, Indonesia
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
