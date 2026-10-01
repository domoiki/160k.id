import { smpp } from "@/lib/content";
import { cn } from "@/lib/cn";

/**
 * The hero's signature panel: a real SMPP v3.4 exchange.
 *
 * Every field name and value here comes from the published
 * "TKDI - SMS Gateway - SMPP Interface v1.0" spec. The message body is the
 * example published on the 160K OTP page.
 *
 * The gateway host, port and allowed source IPs that appear in the same spec
 * are deliberately NOT shown here: that document is marked
 * "Proprietary & Confidential" and publishing a live SMSC endpoint on a
 * marketing page would expose it. The protocol is public; the endpoint is not.
 */

const T = "text-faint";
const K = "text-muted";
const V = "text-ink";
const OP = "text-infra-bright";

/**
 * One operation in the exchange.
 *
 * Recomposed for small screens rather than squeezed: below `sm` the timestamp
 * and direction sit on their own header row and the payload gets the full
 * width, which is what actually needs the room.
 */
function Line({
  time,
  dir,
  children,
  className,
}: {
  time: string;
  dir: "esme" | "smsc";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-[5px] sm:flex sm:gap-4", className)}>
      <div className="flex items-center gap-2.5 sm:block sm:shrink-0">
        {/* 92px, not 64: `14:02:11.480` renders 90.3px in Geist Mono at 12px.
            At 64px it overflowed by 26px and ate into the 16px gutter, so the
            timestamp collided with the operation name beside it. */}
        <span
          className={cn(
            "font-mono text-[12px] tabular-nums sm:block sm:w-[92px] sm:pt-[3px]",
            T,
          )}
        >
          {time}
        </span>
        <span
          className={cn(
            "font-mono text-[12px] tracking-[0.08em] uppercase sm:block sm:w-[56px] sm:pt-[3px]",
            dir === "esme" ? "text-brand" : "text-infra",
          )}
        >
          {dir}
        </span>
      </div>
      <div className="mt-1.5 min-w-0 sm:mt-0 sm:flex-1">{children}</div>
    </div>
  );
}

/** A fixed key column so the values line up. The longest key is
    `destination_addr_npi` at 155px; 156px + a 6px gutter holds it and every
    shorter one. Below `sm` there is no room for a value column, so the pair
    falls back to flowing. */
function Field({ k, v, className }: { k: string; v: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-1.5 text-[12px] leading-[1.55] sm:text-xs sm:gap-0",
        className,
      )}
    >
      <span className={cn("sm:w-[156px] sm:shrink-0 sm:pr-1.5", K)}>{k}</span>
      <span className={cn("min-w-0 break-words", V)}>{v}</span>
    </div>
  );
}

export function SmppTranscript({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "xk-panel overflow-hidden shadow-[0_40px_120px_-40px_rgba(0,0,0,1),0_0_0_1px_rgba(255,255,255,0.02)]",
        className,
      )}
    >
      {/* window chrome */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-white/[0.015] px-3.5 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#2a3242]" />
            <span className="h-2 w-2 rounded-full bg-[#2a3242]" />
            <span className="h-2 w-2 rounded-full bg-brand/70" />
          </span>
          <span className="truncate font-mono text-[12px] text-muted">
            smpp://tkdi-gateway
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 font-mono text-[12px] tracking-[0.1em] text-ok uppercase">
          <span aria-hidden className="xk-animate-blink h-1.5 w-1.5 rounded-full bg-ok" />
          bound
        </span>
      </div>

      {/* transcript */}
      <div className="relative px-3.5 py-4 sm:px-4 sm:py-5">
        <Line time="14:02:11.480" dir="esme">
          <p className={cn("font-mono text-[11.5px] leading-snug sm:text-[13px]", OP)}>
            bind_transceiver
          </p>
          <Field k="system_type" v="Sms" />
          <Field k="interface_version" v="54" />
        </Line>

        <Line time="14:02:11.512" dir="smsc">
          <p className={cn("font-mono text-[11.5px] leading-snug sm:text-[13px]", OP)}>
            bind_transceiver_resp
          </p>
          <Field k="command_status" v="0" />
          <Field k="system_id" v="160K" />
        </Line>

        <div className="my-2.5 flex items-center gap-3" aria-hidden>
          <span className="xk-rule flex-1" />
          <span className="font-mono text-[12px] text-faint">submit_sm</span>
          <span className="xk-rule flex-1" />
        </div>

        <Line time="14:02:11.604" dir="esme">
          <Field k="source_addr_ton" v="1 (International)" />
          <Field k="source_addr_npi" v="1 (E.164 ISDN)" />
          <Field k="destination_addr_ton" v="1 (International)" />
          <Field k="destination_addr_npi" v="1 (E.164 ISDN)" />
          {/* The colon lives inside the fixed-width label so the value starts on
              the same x as every other field. */}
          <p className="mt-1.5 font-mono text-[12px] leading-[1.5] text-ink-dim sm:text-xs sm:flex">
            <span className="shrink-0 text-muted sm:w-[156px] sm:shrink-0 sm:pr-1.5">
              short_message
              <span className="text-faint">: </span>
            </span>
            <span className="min-w-0 break-words text-[#c9d6e8]">
              &ldquo;Your PrivyID authentication code is: 94362. Do not share this code for security reasons.&rdquo;
            </span>
          </p>
        </Line>

        <div className="my-2.5 flex items-center gap-3" aria-hidden>
          <span className="xk-rule flex-1" />
          <span className="font-mono text-[12px] text-faint">deliver_sm</span>
          <span className="xk-rule flex-1" />
        </div>

        <Line time="14:02:12.038" dir="smsc">
          <Field k="err_cd" v="000" className="[&>span:last-child]:text-ok" />
          <Field k="message_state" v="DELIVRD" className="[&>span:last-child]:text-ok" />
        </Line>

        {/* caret */}
        {/* Reuses `Line`'s geometry (92px time column + 16px gutter) via a real
            92px spacer rather than a hardcoded padding, so the caret cannot drift
            out of alignment if that column is ever resized. */}
        <div className="mt-3 sm:flex sm:gap-4">
          <div aria-hidden className="hidden sm:block sm:w-[92px] sm:shrink-0" />
          <p className="flex items-center gap-1.5 font-mono text-[12px] text-faint">
            <span
              className="xk-animate-blink inline-block h-3.5 w-[7px] bg-infra/80"
              aria-hidden
            />
            <span className="sr-only">Awaiting next operation</span>
            <span aria-hidden>enquire_link every {smpp.enquireLink}</span>
          </p>
        </div>
      </div>

      {/* footer strip: real interface metadata.
          The keys are SMPP operation names, the widest 12 characters
          ("enquire_link"). In a third of a 390px screen that could not sit on one
          line, so it wrapped and knocked the three values out of alignment. Below
          `sm` the keys become full-width rows with the value right-aligned; from
          `sm` up there is room for three columns again. */}
      <div className="border-t border-line bg-white/[0.012] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-line">
        {[
          { k: "version", v: smpp.version },
          { k: "enquire_link", v: smpp.enquireLink },
          { k: "max_bind", v: smpp.maxBind },
        ].map((m) => (
          <div
            key={m.k}
            className="flex items-baseline justify-between gap-4 border-b border-line/60 px-3.5 py-2 last:border-b-0 sm:min-w-0 sm:block sm:border-b-0 sm:px-4 sm:py-2.5"
          >
            <p className="font-mono text-[12px] tracking-[0.04em] whitespace-nowrap text-faint uppercase sm:tracking-[0.1em]">
              {m.k}
            </p>
            <p className="shrink-0 font-mono text-[12px] text-ink sm:mt-1 sm:text-xs">
              {m.v}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
