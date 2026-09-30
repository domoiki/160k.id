import type { Metadata } from "next";
import Image from "next/image";
import { Company } from "@/components/sections/Company";
import { FinalCta } from "@/components/sections/FinalCta";
import { PageHero } from "@/components/sections/PageHero";
import { Pillars } from "@/components/sections/Pillars";
import { contact, site } from "@/lib/content";

export const metadata: Metadata = {
  title: "About us",
  description: site.description,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "About us", href: "/about" }]}
        title="Built in Indonesia, to digitalise it."
        lede={`${site.legalName} is a cloud service provider incorporated in ${site.founded}, working across A2P messaging, one-time passwords, contextual calling and international prepaid SIM cards.`}
      />

      {/* Vision, mission, story and team all live in Company — rendered once. */}
      <Pillars />
      <Company />

      <section className="border-t border-line py-20 md:py-24">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-6">
              <h2 className="max-w-[18ch] text-h3 font-semibold text-ink">
                A2P messaging partner
              </h2>
              <p className="mt-5 max-w-[50ch] text-lede text-ink-dim">
                160K is a preferred partner of A2P SMS for EV.
              </p>
            </div>
            <div className="flex items-center lg:col-span-6 lg:justify-end">
              <div className="rounded-[var(--radius-panel)] border border-line bg-surface px-8 py-7">
                <Image
                  src="/assets/brand/logo-ev.webp"
                  alt="EV"
                  width={120}
                  height={21}
                  className="h-6 w-auto opacity-90"
                />
                <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-faint uppercase">
                  Preferred partner
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line py-20 md:py-24">
        <div className="shell">
          <h2 className="font-mono text-[10px] tracking-[0.16em] text-faint uppercase">Visit us</h2>
          <p className="mt-6 max-w-[40ch] text-lede text-ink-dim">
            {contact.addressLines[0]}, {contact.addressLines[1]}, {contact.addressLines[2]}
          </p>
          <a
            href={contact.mapsHref}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-6 inline-flex items-center gap-2 text-sm text-ink-dim transition-colors hover:text-brand"
          >
            Open in Maps
            <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden>
              <path d="M0 4.5h11M7.5 1l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.3"
                    strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
