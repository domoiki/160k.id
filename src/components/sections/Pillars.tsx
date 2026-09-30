import Image from "next/image";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { pillars } from "@/lib/content";

/**
 * The three published principles.
 *
 * Deliberately NOT numbered: cost efficiency, quality and simplicity are
 * parallel ideas, not a sequence, so an 01/02/03 marker would encode a
 * relationship that isn't there.
 */
export function Pillars() {
  return (
    <section id="principles" className="relative border-t border-line py-24 md:py-32">
      <div className="shell">
        <SectionHeader
          rail="Why 160K"
          title="Three principles, and the company we built around them."
          className="max-w-[24ch]"
        />

        <ul className="mt-16 grid border-t border-l border-line md:grid-cols-3">
          {pillars.map((p) => (
            <li
              key={p.keyword}
              className="group relative flex flex-col border-r border-b border-line p-7 transition-colors duration-300 hover:bg-white/[0.02] md:p-8"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px scale-x-0 bg-brand transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-x-100"
              />
              <Image
                src={p.image}
                alt=""
                aria-hidden
                width={44}
                height={44}
                loading="lazy"
                className="mb-7 h-11 w-11 opacity-70 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
              <h3 className="text-2xl font-semibold tracking-[-0.02em] text-ink md:text-[1.75rem]">
                {p.keyword}
              </h3>
              <p className="mt-4 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink-dim">
                {p.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
