import { SectionHeader } from "@/components/ui/SectionHeader";
import { ButtonLink } from "@/components/ui/Button";
import { smpp } from "@/lib/content";

/**
 * Developer section.
 *
 * Every row is read from 160K's own published interface specification.
 * There is no invented REST endpoint, no claimed SDK and no latency or
 * uptime figure on this page.
 */
export function Developer() {
  return (
    <section id="integration" className="relative border-y border-line bg-abyss/40 py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="xk-grid absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,#000_30%,#000_70%,transparent)]" />
      </div>

      <div className="shell">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            rail={`SMPP v${smpp.version}`}
            title="Built for seamless integration."
            className="lg:max-w-[52%]"
          />
          <p className="max-w-[48ch] text-ink-dim lg:pb-2">
            160K exposes a standard SMPP v3.4 interface — the protocol
            telecom operators and messaging platforms already speak. Your
            existing ESME connects directly; no proprietary SDK in between.
          </p>
        </div>

        {/* ---- spec sheet: one panel, two regions, split by a hairline ---- */}
        <div className="mt-14 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-white/[0.015] px-4 py-3 sm:px-6">
            <p className="font-mono text-[11px] text-muted">
              <span className="text-ink">{smpp.title}</span>
              <span className="text-faint">
                {" "}· rev {smpp.revision} · {smpp.date}
              </span>
            </p>
            <span className="rounded-[2px] border border-line-strong px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
              public spec
            </span>
          </div>

          <div className="grid lg:grid-cols-2">
            {/* connection parameters */}
            <div className="border-line lg:border-r">
              <p className="border-b border-line px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-faint uppercase sm:px-6">
                Connection binding
              </p>
              <dl>
                {smpp.connection.map((row) => (
                  <div
                    key={row.field}
                    className="grid grid-cols-[minmax(0,7.5rem)_1fr] gap-x-4 border-b border-line px-4 py-3 last:border-b-0 sm:px-6"
                  >
                    <dt className="font-mono text-[11px] text-muted sm:text-xs">{row.field}</dt>
                    <dd className="font-mono text-[11px] text-ink sm:text-xs">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* error codes */}
            <div>
              <p className="border-b border-line px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-faint uppercase sm:px-6">
                Error codes
              </p>
              <dl className="max-h-[24rem] overflow-y-auto">
                {smpp.errors.map((e) => (
                  <div
                    key={e.code}
                    className="grid grid-cols-[3.25rem_1fr] gap-x-4 border-b border-line px-4 py-2.5 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.02] sm:px-6"
                  >
                    <dt className="font-mono text-[11px] text-infra tabular-nums sm:text-xs">{e.code}</dt>
                    <dd className="text-[13px] leading-snug text-ink-dim">{e.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-line bg-white/[0.012] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="max-w-[58ch] text-xs leading-relaxed text-faint">
              Connection host, port and credentials are issued per account and
              are not published here.
            </p>
            <ButtonLink href={smpp.docHref} external variant="secondary" size="sm" className="shrink-0">
              Download specification
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
