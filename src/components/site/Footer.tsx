import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { contact, products, site, social } from "@/lib/content";

const groups = [
  {
    title: "Products",
    links: products.map((p) => ({ label: p.name, href: p.href })),
  },
  {
    title: "Solutions",
    links: [
      { label: "Communication architecture", href: "/#architecture" },
      { label: "Integration", href: "/#integration" },
      { label: "Why 160K", href: "/#principles" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "API specification", href: "/api" },
      {
        label: "SMPP interface v1.0",
        href: "/assets/docs/TKDI-SMS-Gateway-SMPP-Interface-v1.0.pdf",
      },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-line bg-abyss/50">
      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ---- identity ---- */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-[40ch] text-sm leading-relaxed text-ink-dim">
              A cloud service provider for A2P messaging, OTP solutions,
              contextual communication technology and international prepaid SIM
              cards.
            </p>

            <address className="mt-7 space-y-3 text-sm not-italic text-ink-dim">
              <a
                href={`mailto:${contact.email}`}
                className="block w-fit transition-colors hover:text-ink"
              >
                {contact.email}
              </a>
              <a
                href={contact.whatsappHref}
                target="_blank"
                rel="noreferrer noopener"
                className="block w-fit transition-colors hover:text-ink"
              >
                {contact.whatsapp}
              </a>
              <p className="text-ink-dim">
                {contact.addressLines[0]}
                <br />
                {contact.addressLines[1]}, {contact.addressLines[2]}
              </p>
            </address>
          </div>

          {/* ---- link columns ---- */}
          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8">
            {groups.map((g) => (
              <div key={g.title}>
                <p className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">{g.title}</p>
                <ul className="mt-5 space-y-3">
                  {g.links.map((l) => {
                    const external = l.href.startsWith("http") || l.href.endsWith(".pdf");
                    return (
                      <li key={l.label}>
                        {external ? (
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-sm text-ink-dim transition-colors duration-200 hover:text-ink"
                          >
                            {l.label}
                          </a>
                        ) : (
                          <Link
                            href={l.href}
                            className="text-sm text-ink-dim transition-colors duration-200 hover:text-ink"
                          >
                            {l.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ---- partner + base rule ---- */}
        <div className="mt-14 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3">
            <span className="font-mono text-[10px] tracking-[0.12em] text-faint uppercase">
              EV preferred partner
            </span>
            <Image
              src="/assets/brand/logo-ev.webp"
              alt="EV"
              width={56}
              height={10}
              loading="lazy"
              className="h-3.5 w-auto opacity-55 grayscale transition-opacity duration-300 hover:opacity-90 hover:grayscale-0"
            />
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ul className="flex items-center gap-4">
              {social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-xs text-ink-dim transition-colors duration-200 hover:text-ink"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="font-mono text-[10px] tracking-[0.08em] text-faint">
              © {year} {site.legalName}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
