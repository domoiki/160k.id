import { capabilities } from "@/lib/content";

/**
 * Capability layer.
 *
 * Reads as a patch panel rather than an icon row: each capability is a port
 * with a live indicator, because every one of these is a service 160K
 * actually operates. Hairlines are drawn by a 1px gap over a line-coloured
 * backing, so the grid stays correct at every breakpoint without nth-child
 * arithmetic.
 */
export function CapabilityStrip() {
  return (
    <section aria-label="Capabilities" className="relative border-y border-line bg-abyss/60">
      <div className="shell">
        <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
          {capabilities.map((c) => (
            <li
              key={c}
              className="group relative flex items-center gap-2.5 bg-abyss/60 px-3 py-4 transition-colors duration-300 hover:bg-white/[0.03] sm:gap-3 sm:px-4 sm:py-5"
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-faint transition-colors duration-300 group-hover:bg-brand"
              />
              <span className="text-[0.8125rem] leading-tight text-ink-dim transition-colors duration-300 group-hover:text-ink">
                {c}
              </span>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-brand transition-transform duration-400 ease-[var(--ease-out-expo)] group-hover:scale-x-100"
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
