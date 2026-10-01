import { ButtonLink } from "@/components/ui/Button";
import { contact, site } from "@/lib/content";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="relative overflow-hidden border-t border-line py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_100%,rgba(255,43,43,0.10),transparent_70%)]" />
        <div className="xk-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(to_top,#000,transparent_75%)]" />
      </div>

      <div className="shell">
        <div className="mx-auto max-w-[54ch] text-center">
          <h2
            id="cta-heading"
            className="text-h2 font-semibold text-ink md:text-[3.5rem] md:leading-[1.02]"
          >
            Let&rsquo;s build better communication.
          </h2>
          <p className="mx-auto mt-7 max-w-[48ch] text-lede text-ink-dim">
            Tell us what you need to reach customers through. We&rsquo;ll
            configure the channel, the interface and the target.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/contact" size="lg">
              Contact us
            </ButtonLink>
            <ButtonLink href={contact.whatsappHref} external variant="secondary" size="lg">
              WhatsApp {contact.whatsapp}
            </ButtonLink>
          </div>

          <p className="mt-10 font-mono text-[12px] text-faint">
            {site.legalName} · {contact.addressLines[1]}, {contact.addressLines[2]}
          </p>
        </div>
      </div>
    </section>
  );
}
