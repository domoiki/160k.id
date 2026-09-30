import type { Metadata } from "next";
import { FinalCta } from "@/components/sections/FinalCta";
import { PageHero } from "@/components/sections/PageHero";
import { SmppTranscript } from "@/components/visual/SmppTranscript";
import { ButtonLink } from "@/components/ui/Button";
import { smpp } from "@/lib/content";

export const metadata: Metadata = {
  title: "API specification",
  description:
    "160K exposes a standard SMPP v3.4 interface for message submission and delivery receipts. Connection binding, addressing types and error codes.",
  alternates: { canonical: "/api" },
};

export default function ApiPage() {
  return (
    <>
      <PageHero
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Resources", href: "/api" }]}
        title="SMPP v3.4, the interface 160K speaks."
        lede="160K's messaging gateway is reached over standard SMPP. If you already operate an ESME, or work with one, integration is a configuration exercise rather than a project."
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <ButtonLink href={smpp.docHref} external size="lg">
            Download specification
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary" size="lg">
            Request access
          </ButtonLink>
        </div>
      </PageHero>

      {/* ---- what it is ---- */}
      <section className="border-y border-line bg-abyss/50 py-16 md:py-20">
        <div className="shell">
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {[
              {
                k: "Operations",
                v: "submit_sm carries mobile-terminated SMS from your ESME to the gateway. deliver_sm returns the delivery receipt, or an originating message, to you.",
              },
              {
                k: "Binding",
                v: "SMPP v3.4 supports Transceiver (TRx), Transmitter (Tx) and Receiver (Rx) binding modes. The gateway permits a maximum of two simultaneous binds.",
              },
              {
                k: "Keepalive",
                v: "enquire_link runs on a 60 second interval, which holds the session open and surfaces a dead peer quickly.",
              },
            ].map((b) => (
              <div key={b.k}>
                <p className="font-mono text-[10px] tracking-[0.14em] text-faint uppercase">{b.k}</p>
                <p className="mt-4 max-w-[40ch] text-sm leading-relaxed text-ink-dim">{b.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- spec sheet ---- */}
      <section className="py-20 md:py-28">
        <div className="shell">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-[20ch] text-h2 font-semibold text-ink">
              Connection parameters
            </h2>
            <p className="max-w-[46ch] font-mono text-[11px] text-faint md:pb-2">
              {smpp.title} · rev {smpp.revision} · {smpp.date}
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            <dl>
              {smpp.connection.map((row) => (
                <div
                  key={row.field}
                  className="grid grid-cols-1 gap-1 border-b border-line px-5 py-4 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:gap-6 sm:px-7"
                >
                  <dt className="font-mono text-xs text-muted">{row.field}</dt>
                  <dd className="font-mono text-xs text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="border-t border-line bg-white/[0.012] px-5 py-4 sm:px-7">
              <p className="text-xs leading-relaxed text-faint">
                Host, port, system id and password are issued per account and are
                supplied on request. They are not published on this page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---- exchange ---- */}
      <section className="pb-20 md:pb-28">
        <div className="shell">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5">
              <h2 className="max-w-[18ch] text-h2 font-semibold text-ink">
                One message, end to end
              </h2>
              <p className="mt-6 max-w-[48ch] text-lede text-ink-dim">
                A submission, its binding, and the delivery report that comes
                back. Field names and values below follow 160K&rsquo;s published
                specification; the message body is the example given on the OTP
                page.
              </p>
              <dl className="mt-10 space-y-5 border-t border-line pt-6">
                {[
                  { k: "bind_transceiver", v: "Opens the session. source and destination type-of-number and number-plan-identifier are negotiated here." },
                  { k: "submit_sm", v: "Carries the message toward the mobile network." },
                  { k: "deliver_sm", v: "Returns the delivery report. err_cd 000 means no error." },
                ].map((r) => (
                  <div key={r.k}>
                    <dt className="font-mono text-xs text-infra">{r.k}</dt>
                    <dd className="mt-1.5 max-w-[44ch] text-sm leading-relaxed text-ink-dim">
                      {r.v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:col-span-7">
              <SmppTranscript />
            </div>
          </div>
        </div>
      </section>

      {/* ---- errors ---- */}
      <section className="border-t border-line py-20 md:py-28">
        <div className="shell">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-[20ch] text-h2 font-semibold text-ink">Error codes</h2>
            <p className="max-w-[44ch] text-sm text-ink-dim md:pb-2">
              Returned in <span className="font-mono text-infra">err_cd</span> on
              the delivery report. The list below is taken from the specification.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[var(--radius-panel)] border border-line bg-surface">
            <dl className="grid sm:grid-cols-2">
              {smpp.errors.map((e, i) => (
                <div
                  key={e.code}
                  className={`flex items-baseline gap-5 border-b border-line px-5 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-7 ${
                    i % 2 === 0 ? "sm:border-r" : ""
                  } ${i === smpp.errors.length - 1 ? "sm:border-b-0" : ""}`}
                >
                  <dt className="w-12 shrink-0 font-mono text-xs text-infra tabular-nums">
                    {e.code}
                  </dt>
                  <dd className="text-sm leading-snug text-ink-dim">{e.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-8">
            <ButtonLink href={smpp.docHref} external variant="secondary">
              Download the full specification (PDF)
            </ButtonLink>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
