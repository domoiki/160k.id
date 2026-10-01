import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/ContactForm";
import { PageHero } from "@/components/sections/PageHero";
import { contact, site, social } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact 160K — ${site.legalName}, Jakarta. Email, WhatsApp and office location.`,
  alternates: { canonical: "/contact" },
};

const channels = [
  {
    label: "Email",
    value: contact.email,
    href: `mailto:${contact.email}`,
    note: "Support and commercial enquiries",
  },
  {
    label: "WhatsApp",
    value: contact.whatsapp,
    href: contact.whatsappHref,
    note: "Fastest route to a person",
  },
  {
    label: "WhatsApp (alt)",
    value: contact.whatsappAlt,
    href: contact.whatsappAltHref,
    note: "Secondary line",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Contact", href: "/contact" }]}
        title="Tell us what you need to reach customers through."
        lede="Product questions, integration requests or a channel you are not sure about — send it over and we will come back to you."
      />

      <section className="pb-24 md:pb-32">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            {/* ---- channels ---- */}
            <div className="lg:col-span-5">
              <h2 className="font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
                Direct channels
              </h2>
              <ul className="mt-7 border-t border-line">
                {channels.map((c) => (
                  <li key={c.label} className="border-b border-line py-5">
                    <a
                      href={c.href}
                      {...(c.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer noopener" }
                        : {})}
                      className="group block"
                    >
                      <span className="font-mono text-[12px] tracking-[0.12em] text-faint uppercase">
                        {c.label}
                      </span>
                      <span className="mt-2 block text-lg text-ink transition-colors duration-200 group-hover:text-brand">
                        {c.value}
                      </span>
                      <span className="mt-1.5 block text-xs text-muted">{c.note}</span>
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                <h2 className="font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
                  Office
                </h2>
                <address className="mt-5 text-[0.9375rem] leading-relaxed text-ink-dim not-italic">
                  {site.legalName}
                  <br />
                  {contact.addressLines[0]}
                  <br />
                  {contact.addressLines[1]}
                  <br />
                  {contact.addressLines[2]}
                </address>
                <a
                  href={contact.mapsHref}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm text-ink-dim transition-colors hover:text-brand"
                >
                  Open in Maps
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none" aria-hidden>
                    <path d="M0 4.5h11M7.5 1l4 3.5-4 3.5" stroke="currentColor" strokeWidth="1.3"
                          strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              <div className="mt-10">
                <h2 className="font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
                  Follow
                </h2>
                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-1">
                  {social.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-block py-2.5 text-sm text-ink-dim transition-colors hover:text-ink"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ---- form ---- */}
            <div className="lg:col-span-7">
              <h2 className="font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
                Send a message
              </h2>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
