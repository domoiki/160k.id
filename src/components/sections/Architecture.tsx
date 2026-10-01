"use client";

import { useState } from "react";
import { signalPath } from "@/lib/content";
import { cn } from "@/lib/cn";

/**
 * Communication architecture.
 *
 * Four stacked layers joined by one vertical signal bus. The bus is the same
 * thread that leaves the hero panel — message in, message delivered. Hovering
 * or focusing a node lifts the whole path so the relationship is legible
 * before anything is clicked.
 */
/* One active node per layer, not one index shared by all of them.

   `signalPath.inbound` and `signalPath.outbound` are both five long, so a bare
   index made the two layers aliases: hovering "Business applications" (0)
   lit "Messaging" (0) as well, and dimmed the four nodes either side of it in
   both grids. The diagram claimed a path that does not exist. The key carries
   the layer, so hover highlights exactly the node under the pointer. */
type Layer = "inbound" | "outbound";
type Active = { layer: Layer; index: number } | null;

export function Architecture() {
  const [active, setActive] = useState<Active>(null);
  /* Dim siblings in the hovered node's own layer only. Dimming across layers
     implied a route between an application and a channel that does not exist —
     the diagram has no edges, it only shows the two stacks either side of the
     bus. The endpoint panel is what carries the "this reaches a device" idea. */
  const dim = (layer: Layer, i: number) =>
    active !== null && active.layer === layer && active.index !== i;

  return (
    <section id="architecture" className="relative scroll-mt-24 py-24 md:py-32">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="xk-grid absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000,transparent_75%)]" />
      </div>

      <div className="shell">
        <div className="max-w-[58ch]">
          <p className="mb-5 flex items-center gap-3 font-mono text-[12px] tracking-[0.14em] text-muted uppercase">
            <span aria-hidden className="inline-block h-px w-6 bg-infra" />
            Signal path
          </p>
          <h2 className="text-h2 font-semibold text-ink">
            One integration. Every channel your business needs.
          </h2>
          <p className="mt-6 text-lede text-ink-dim">
            Your systems talk to 160K once. From there the same connection
            reaches messaging, verification, targeting, location and voice —
            and lands on the customer&rsquo;s device.
          </p>
        </div>

        {/* ---------------- the diagram ---------------- */}
        <div className="mt-16 flex flex-col items-center">
          {/* layer 1 — applications */}
          <LayerLabel>Business applications</LayerLabel>
          <div className="mt-4 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {signalPath.inbound.map((n, i) => (
              <Node
                key={n}
                label={n}
                index={i}
                active={active?.layer === "inbound" && active.index === i}
                onActivate={(index) => setActive(index === null ? null : { layer: "inbound", index })}
                dimmed={dim("inbound", i)}
                tone="neutral"
              />
            ))}
          </div>

          <Bus label="submit_sm" />

          {/* layer 2 — the core */}
          <div className="w-full">
            <div
              className="relative overflow-hidden rounded-[var(--radius-panel)] border border-infra/25 bg-[linear-gradient(180deg,rgba(76,141,255,0.09),rgba(76,141,255,0.02)_60%,transparent)] px-5 py-6 text-center md:px-8"
            >
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-infra/70 to-transparent" />
              <p className="font-mono text-[12px] tracking-[0.16em] text-infra-bright uppercase">
                {signalPath.core}
              </p>
              <p className="mx-auto mt-2.5 max-w-[46ch] font-mono text-[12px] leading-relaxed text-muted">
                SMPP v3.4 · bind Transceiver, Transmitter or Receiver ·
                enquire_link every 60s
              </p>
            </div>
          </div>

          <Bus label="deliver_sm" />

          {/* layer 3 — channels */}
          <div className="w-full">
            <LayerLabel>Channels</LayerLabel>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {signalPath.outbound.map((n, i) => (
                <Node
                  key={n}
                  label={n}
                  index={i}
                  active={active?.layer === "outbound" && active.index === i}
                  onActivate={(index) => setActive(index === null ? null : { layer: "outbound", index })}
                  dimmed={dim("outbound", i)}
                  tone="channel"
                />
              ))}
            </div>
          </div>

          <Bus label="message_state: DELIVRD" />

          {/* layer 4 — customer */}
          <div className="w-full max-w-md">
            <div
              className={cn(
                "rounded-[var(--radius-panel)] border px-5 py-5 text-center transition-all duration-400 ease-[var(--ease-out-expo)]",
                active !== null
                  ? "border-brand/50 bg-brand/[0.07]"
                  : "border-line bg-surface",
              )}
            >
              <p className="text-lg font-medium text-ink">{signalPath.endpoint}</p>
              <p className="mt-1.5 font-mono text-[12px] text-faint">on their device</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function LayerLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 font-mono text-[12px] tracking-[0.16em] text-faint uppercase">
      {children}
    </p>
  );
}

/** The vertical signal bus. A packet travels it once, then rests. */
function Bus({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="relative flex h-16 w-full flex-col items-center justify-center sm:h-20"
    >
      <span className="h-4 w-px bg-gradient-to-b from-transparent to-line-strong" />
      <span className="relative my-0.5 h-10 w-px overflow-hidden bg-line-strong/40">
        <span
          className="xk-signal-dot absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-infra"
        />
      </span>
      <span className="h-4 w-px bg-gradient-to-t from-transparent to-line-strong" />
            {/* Full-bleed, not shrink-to-fit. Absolutely positioned inside the flex
                column, this collapsed to its own content width, and mono text does not
                wrap — so at 12px the label painted past its own box and the audit read
                that as a spill. inset-x-0 gives it the bus's width to centre in. */}
            <span className="absolute inset-x-0 bottom-0.5 text-center font-mono text-[12px] tracking-[0.1em] text-faint uppercase">
              {label}
            </span>
          </div>
        );
      }

function Node({
  label,
  index,
  active,
  onActivate,
  dimmed,
  tone,
}: {
  label: string;
  index: number;
  active: boolean;
  onActivate: (i: number | null) => void;
  dimmed: boolean;
  tone: "neutral" | "channel";
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onActivate(active ? null : index)}
      onMouseEnter={() => onActivate(index)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(index)}
      onBlur={() => onActivate(null)}
      className={cn(
        "group relative w-full rounded-[var(--radius-panel)] border px-3 py-4 text-left transition-all duration-400 ease-[var(--ease-out-expo)]",
        dimmed ? "border-line opacity-40" : "border-line opacity-100",
        tone === "channel"
          ? "bg-surface hover:border-infra/45"
          : "bg-abyss/60 hover:border-white/20",
        "hover:bg-white/[0.03]",
        active && (tone === "channel" ? "border-infra/60" : "border-white/30"),
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mb-2.5 block h-1 w-6 rounded-full transition-all duration-400",
          tone === "channel"
            ? active
              ? "bg-infra"
              : "bg-infra/50 group-hover:bg-infra"
            : active
              ? "bg-brand"
              : "bg-faint group-hover:bg-brand",
        )}
      />
      <span className="block text-sm leading-snug text-ink-dim transition-colors duration-200 group-hover:text-ink">
        {label}
      </span>
    </button>
  );
}
