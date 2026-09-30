import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content Security Policy.
 *
 * Production is strict. Development needs three relaxations, each for a
 * concrete reason:
 *
 *  - `'unsafe-eval'` — React reconstructs callstacks with eval() in dev, and
 *    Turbopack's HMR client relies on it. React never uses eval in production.
 *  - `ws:` / `wss:` in connect-src — the HMR socket. `'self'` does not
 *    reliably cover the websocket origin across browsers.
 *  - no `upgrade-insecure-requests` — that directive would try to upgrade
 *    http://localhost to https and break the dev server.
 *
 * `script-src`/`style-src` keep `'unsafe-inline'` in both modes: Next.js emits
 * an inline hydration bootstrap and next/image writes inline styles. Removing
 * those would need a nonce via middleware, which is more machinery than a
 * static marketing site warrants.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // Keep Turbopack scoped to the project: package-lock.json exists in the
  // parent home directory and would otherwise be pulled into the graph.
  turbopack: {
    root: __dirname,
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // HSTS only makes sense over TLS; sending it from localhost is noise.
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
      {
        // The published SMPP specification is a stable, versioned artefact.
        source: "/assets/docs/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
