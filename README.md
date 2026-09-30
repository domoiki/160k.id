# 160K — website redesign

A ground-up rebuild of the public 160K website (`160k.co.id`) as a modern
enterprise communication-infrastructure site.

Built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS v4** and
**React 19**. Static-rendered, no backend, deployable to Vercel as-is.

---

## Content policy

Every factual claim on this site is traceable to either:

1. the public 160k.co.id website, or
2. the official `TKDI - SMS Gateway - SMPP Interface v1.0` specification
   published at `160k.co.id/api/`.

No statistics, customers, partnerships, certifications, uptime figures,
latency numbers, SDKs or pricing have been invented. Where the source material
did not support a claim, the claim is absent.

`src/lib/content.ts` is the single source of truth for all copy and technical
facts. Nothing factual is hard-coded in components.

### Deliberate departures from the brief

| Brief asked for | What was built | Why |
|---|---|---|
| A REST example (`POST /v1/messages`) | A real SMPP v3.4 exchange | 160K's published interface is SMPP, not REST. The spec was downloaded from their own API page and the transcript uses its actual field names and values. |
| Electric blue / cyan accent | 160K red + infrastructure blue | The 160K logo is `#FF0000` and their own pillar icons are `#1D4999`. A generic blue accent would have replaced the brand instead of preserving it. |
| — | Gateway host/port/IPs omitted | The spec is marked "Proprietary & Confidential". Publishing a live SMSC endpoint on a marketing page would expose it. Protocol facts are public; the endpoint is issued per account. |

---

## Design system

Tokens are defined once in `src/app/globals.css` under `@theme` (Tailwind v4
CSS-first config). Components reference tokens, never raw hex values.

### Colour

Sampled from 160K's own assets rather than chosen arbitrarily.

| Token | Value | Role |
|---|---|---|
| `--color-void` | `#05070c` | Page base |
| `--color-abyss` / `--color-surface` / `--color-panel` | `#070a11` / `#0a0e17` / `#0e1420` | Stacked surfaces |
| `--color-brand` | `#ff2b2b` | Accent red, from the logo |
| `--color-brand-solid` | `#d91f1f` | Button fill (see accessibility) |
| `--color-infra` | `#4c8dff` | The machine layer: code, diagrams, signal flow |
| `--color-infra-deep` | `#1d4999` | 160K's own blue, from their pillar icons |

Red carries **brand** moments; blue carries the **technical** layer. They never
compete for the same element.

### Typography

Geist (display and UI) and Geist Mono (code, PDU fields, technical metadata).
Two faces with clearly distinct roles. Geist was chosen over Inter because it
reads as an engineering tool, which suits infrastructure positioning.

Type scale is defined as tokens (`--text-display`, `--text-h2`, `--text-h3`,
`--text-lede`) using `clamp()` so headings scale fluidly between breakpoints.

### Radius

A deliberate scale, not one value everywhere: `2px` (buttons, technical
elements) → `8px` (panels) → `12px` (cards).

---

## Accessibility

- **Contrast** — every text token was verified numerically against its actual
  background. The ink ramp is `ink 17.79:1 · ink-dim 9.41:1 · muted 6.89:1 ·
  faint 5.11:1`, all WCAG AA or better.
- Primary buttons use `--color-brand-solid` (`#d91f1f`) rather than the vivid
  brand red, because white on `#ff2b2b` only reaches `3.73:1` and fails AA.
  The logo itself is untouched.
- Semantic landmarks, a single `h1` per page, no skipped heading levels.
- Skip-to-content link, visible `:focus-visible` rings on every interactive
  element.
- Mobile menu locks page scroll, closes on `Escape` and on navigation, and
  exposes `aria-expanded` / `aria-controls`.
- Decorative images use `alt=""`; meaningful ones carry descriptive alt text.
- `prefers-reduced-motion` disables all ambient animation globally.

## Security headers

Set in `next.config.ts` and split by environment:

| Header | Production | Development |
|---|---|---|
| `Content-Security-Policy` | strict, no `unsafe-eval` | adds `'unsafe-eval'`, `ws: wss:`; omits `upgrade-insecure-requests` |
| `Strict-Transport-Security` | 2 years, preload | omitted (meaningless on localhost) |
| `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` / `Permissions-Policy` | set | set |

The dev-only relaxations are required: React reconstructs callstacks with
`eval()` in development, Turbopack's HMR client needs a websocket, and
`upgrade-insecure-requests` would try to upgrade `http://localhost` to HTTPS
and break the dev server. **React never uses `eval()` in production**, so the
production policy stays strict.

`script-src`/`style-src` keep `'unsafe-inline'` in both modes because Next.js
emits an inline hydration bootstrap and `next/image` writes inline styles.
Removing those would require a nonce via middleware — more machinery than a
static marketing site warrants.

## Verification

Two scripts, both driving headless Edge over the Chrome DevTools Protocol
using Node's built-in `WebSocket` — no dependency added.

### `scripts/verify-hydration.mjs`

Clean profile, `--disable-extensions`. Reports hydration warnings, CSP/eval
errors, console errors and uncaught exceptions.

```bash
npm run build && npm run start -- --port 3952
node scripts/verify-hydration.mjs http://127.0.0.1:3952/
```

Current result across `/`, `/products`, `/products/a2p-messaging`, `/api`,
`/about` and `/contact`: **0 hydration warnings, 0 CSP errors, 0 console
errors, 0 uncaught exceptions**, in both dev and production.

### `scripts/verify-extension-safety.mjs`

The hydration warning people actually see on this site comes from **Dark
Reader**, not from the markup. See below. This script injects a stand-in
extension that rewrites the same properties Dark Reader rewrites, and reports
how many elements it touched:

```bash
node scripts/verify-extension-safety.mjs <url> honor <port>   # real behaviour
node scripts/verify-extension-safety.mjs <url> force <port>   # control
```

| Mode | Extension active | Elements mutated | `data-darkreader-*` in DOM |
|---|---|---|---|
| `force` (control, pre-fix) | yes | 8869 | 32 |
| `honor` (real behaviour) | **no — skipped** | **0** | **0** |

---

## Dark Reader and the hydration warning

React reported a hydration mismatch on every page. Every single differing
attribute in that diff was Dark Reader's:

```
- data-darkreader-inline-color=""
- style={{color:"transparent",--darkreader-inline-color:"transparent"}}
- data-darkreader-inline-stroke=""
- data-darkreader-inline-bgimage=""
```

The extension rewrites inline styles and SVG attributes on the live DOM
*before* React hydrates, so the client tree disagrees with the server HTML on
every `<img>` and `<path>`. The server response contains none of these
attributes.

**The fix is `data-darkreader-ignore` on `<html>`** — Dark Reader's own
documented opt-out. This site is natively dark by design, so inverting it
achieves nothing visually while breaking hydration. The attribute is scoped to
this document; the extension stays installed and works everywhere else.

Two supporting changes reduce the surface any inline-style-rewriting extension
has to work with:

- The three decorative `style={{ background: "radial-gradient(...)" }}`
  overlays and the architecture signal-dot are now real CSS utilities
  (`xk-plate-glow`, `xk-signal-dot`). Extensions rewrite inline styles; with
  no inline style there is nothing to rewrite.
- `suppressHydrationWarning` on `<html>` was tried first and removed. It does
  not cascade to descendants, so it suppressed nothing relevant and risked
  masking genuine mismatches.

The one remaining inline style is the `width` on a market-data bar, which
encodes a value rather than a colour and is left untouched by these tools.

---

# Deployment

Pushed to `github.com/domoiki/160k.id` and connected to a Vercel project, so
**every push to `main` auto-deploys to production** (typically ~15 s build).

| | |
|---|---|
| Production URL | `https://160k.vercel.app` |
| Repo | `github.com/domoiki/160k.id` |
| Framework preset | Next.js (auto-detected) — no manual config |

All 12 routes are statically prerendered, so the whole site is served from the
edge with no server runtime.

### A note on canonical URLs

`sitemap.xml` and the `<link rel="canonical">` tags deliberately point at
`https://160k.co.id`, the real domain, not at the `*.vercel.app` hostname.
That is the right call as the end state: attach `160k.co.id` to this Vercel
project and every canonical in the project becomes correct with no code change.

Until that DNS is attached, the hosted site advertises a canonical that points
at the old site. That is harmless for a staging URL but worth knowing before
sharing the `*.vercel.app` link widely. `site.url` in `src/lib/content.ts` is
the single place to change it if you would rather self-canonicalise.

### Verifying a deployment

```bash
npm run verify -- https://160k.vercel.app/
npm run verify:extension -- https://160k.vercel.app/ honor 9334
```

---

## Performance

- Static prerendering for all 11 routes.
- Images converted to WebP: **4.01 MB → 0.82 MB**.
- Zero animation libraries, zero UI dependencies. The only runtime
  dependencies are `next`, `react` and `react-dom`.
- Animation is CSS-only except for two small pieces of state (nav scroll
  position, architecture hover).
- Fonts self-hosted and subset via `next/font`.

---

## Project structure

```
src/
  app/
    layout.tsx              # shell, fonts, SEO metadata, Organization JSON-LD
    page.tsx                # homepage
    globals.css             # design tokens + component utilities
    products/
      page.tsx              # product index
      [slug]/page.tsx       # product detail (generateStaticParams)
    about/ api/ contact/    # interior pages
    not-found.tsx sitemap.ts robots.ts icon.png
  components/
    brand/Logo.tsx
    ui/                     # Button, SectionHeader
    site/                   # Navbar, Footer
    visual/                 # SmppTranscript
    sections/               # Hero, CapabilityStrip, Products, Developer,
                            # Architecture, Pillars, Company, MarketData,
                            # FinalCta, PageHero, ContactForm
  lib/
    content.ts              # all copy and verified technical facts
    cn.ts
public/assets/
  brand/ products/ company/ operators/ docs/
```

---

## Commands

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve the production build
npm run lint     # eslint
```

## Notes for whoever picks this up

- The logo lockup on the live site is a red mark plus a **black** wordmark.
  Black disappears on a near-black surface, so `Logo.tsx` uses the red mark
  (`logo-mark.webp`, tight-cropped from the original) with the wordmark set as
  live text. The mark image itself was not recoloured.
- The contact form has no backend by design. It composes a prefilled email to
  160K's published support address and offers WhatsApp alongside. Wiring it to
  a real endpoint is a small, isolated change in
  `src/components/sections/ContactForm.tsx`.
- `src/app/products/[slug]/page.tsx` reads from `productDetails` in
  `content.ts`; adding a product means adding an entry to both `products` and
  `productDetails`.
