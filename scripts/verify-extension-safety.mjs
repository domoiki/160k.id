/**
 * Proves the fix for the Dark Reader hydration warning.
 *
 * Real Dark Reader is a browser extension and cannot be driven headlessly, so
 * this injects a faithful stand-in via CDP. It walks the DOM with a
 * MutationObserver and rewrites exactly the properties Dark Reader rewrites
 * (inline `color` on images, `stroke`/`fill` on SVG, `background` on divs),
 * stamping the same `data-darkreader-*` attributes that appear in the real
 * diff.
 *
 * Two modes:
 *   honor — respects `data-darkreader-ignore`, as the real extension does
 *   force — ignores it, simulating the pre-fix behaviour
 *
 * `force` is the control: it must reproduce the warning, otherwise a clean
 * result in `honor` mode would prove nothing.
 *
 *   node scripts/verify-extension-safety.mjs <url> <honor|force> <cdpPort>
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const URL_ = process.argv[2] ?? "http://127.0.0.1:3952/";
const MODE = process.argv[3] ?? "honor";
const CDP_PORT = Number(process.argv[4] ?? 9334);

/**
 * Runs at document_start, where `document.documentElement` is still null.
 * The observer therefore watches `document` itself (always available) and
 * resolves the root lazily on each callback, so mutations land as the parser
 * inserts nodes — i.e. before React's modules execute and hydrate.
 */
const EXTENSION = `(() => {
  window.__drRan = (window.__drRan || 0) + 1;
  window.__drError = '';
  window.__drSkipped = false;
  try {
    const honor = ${MODE === "honor"};
    const attr = 'data-darkreader-inline-';
    let n = 0;
    Object.defineProperty(window, '__drInjected', { get: () => n, configurable: true });

    const scan = (el) => {
      if (!el || el.nodeType !== 1) return;
      if (el.hasAttribute && el.hasAttribute(attr + 'color')) return;
      n++;

      if (el.tagName === 'IMG') {
        if (el.style && el.style.color) {
          el.setAttribute(attr + 'color', '');
          el.style.setProperty('--darkreader-inline-color', el.style.color);
        }
      } else if (el.tagName === 'path' || el.tagName === 'svg') {
        const s = el.getAttribute && (el.getAttribute('stroke') || el.getAttribute('fill'));
        if (s) {
          el.setAttribute(attr + 'stroke', '');
          el.style.setProperty('--darkreader-inline-stroke', s);
        }
      } else if (el.tagName === 'DIV' && el.style &&
                 (el.style.background || el.style.backgroundImage)) {
        el.setAttribute(attr + 'bgimage', '');
        el.setAttribute(attr + 'bgcolor', '');
      }

      if (el.querySelectorAll) el.querySelectorAll('img,path,svg,div').forEach(scan);
    };

    let obs;
    const boot = () => {
      const root = document.documentElement;
      if (!root) return;
      if (honor && root.hasAttribute('data-darkreader-ignore')) {
        window.__drSkipped = true;
        obs.disconnect();
        return;
      }
      if (!root.hasAttribute('data-darkreader-proxy-injected')) {
        root.setAttribute('data-darkreader-proxy-injected', 'true');
      }
    };

    obs = new MutationObserver((records) => {
      boot();
      if (window.__drSkipped) return;
      for (const r of records) {
        r.addedNodes.forEach((node) => { try { scan(node); } catch (_) {} });
      }
    });
    obs.observe(document, { childList: true, subtree: true });
    boot();
  } catch (e) {
    window.__drError = String(e);
  }
})();`;

const profile = mkdtempSync(join(tmpdir(), "dr-profile-"));
const browser = spawn(
  EDGE,
  [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let page;
for (let i = 0; i < 40; i++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`)).json();
    page = list.find((t) => t.type === "page");
    if (page?.webSocketDebuggerUrl) break;
  } catch {
    /* not up yet */
  }
  await sleep(250);
}
if (!page?.webSocketDebuggerUrl) {
  console.error("CDP never came up");
  process.exit(2);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
const logs = [];

ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result ?? {});
    pending.delete(m.id);
    return;
  }
  if (m.method === "Runtime.consoleAPICalled") {
    logs.push(
      (m.params.args ?? []).map((a) => a.value ?? a.description ?? "").join(" "),
    );
  }
};

const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Runtime.enable");
await send("Page.enable");
await send("Page.addScriptToEvaluateOnNewDocument", { source: EXTENSION });
await send("Page.navigate", { url: URL_ });
await sleep(8000);

const probe = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    ran: window.__drRan ?? 'never',
    skipped: window.__drSkipped ?? false,
    err: window.__drError || '',
    mutations: window.__drInjected ?? -1,
    drAttrs: document.querySelectorAll('[data-darkreader-inline-color],[data-darkreader-inline-stroke],[data-darkreader-inline-bgimage]').length
  })`,
  returnByValue: true,
});

const hydration = logs.filter((l) =>
  /hydrated but some attributes|didn't match|did not match/i.test(l),
);

/* In dev, Next.js captures hydration errors into its own overlay rather than
   letting them surface as plain console.error, so console capture alone can
   report zero. Read the overlay's shadow DOM as the authoritative signal. */
const overlay = await send("Runtime.evaluate", {
  expression: `(() => {
    const p = document.querySelector('nextjs-portal');
    if (!p) return JSON.stringify({ portal: false });
    const root = p.shadowRoot;
    if (!root) return JSON.stringify({ portal: true, shadow: false });
    const text = (root.textContent || '').replace(/\\s+/g, ' ').trim();
    const m = text.match(/(\\d+)\\s*Issue/i);
    return JSON.stringify({
      portal: true,
      shadow: true,
      issueBadge: m ? m[0] : null,
      head: text.slice(0, 120)
    });
  })()`,
  returnByValue: true,
});

let ov = {};
try {
  ov = JSON.parse(overlay.result?.value ?? "{}");
} catch {}

let dom = {};
try {
  dom = JSON.parse(probe.result?.value ?? "{}");
} catch {}

console.log(`mode            : ${MODE}`);
console.log(`script ran      : ${dom.ran}${dom.err ? ` (error: ${dom.err})` : ""}`);
console.log(`extension active: ${dom.skipped ? "no — skipped via data-darkreader-ignore" : "yes"}`);
console.log(`elements mutated: ${dom.mutations}  (darkreader attrs in DOM: ${dom.drAttrs})`);
console.log(`hydration warns : ${hydration.length}${hydration.length ? " (console)" : ""}`);
if (hydration.length) {
  const line =
    hydration[0]
      .split("\n")
      .find((l) => l.includes("darkreader"))
      ?.trim() ?? hydration[0].slice(0, 120);
  console.log(`  evidence      : ${line.slice(0, 150)}`);
}
console.log(
  `dev overlay     : ${ov.portal ? `present${ov.issueBadge ? ` — ${ov.issueBadge}` : " — no issues"}` : "absent (production build)"}`,
);
if (ov.head) console.log(`  overlay text  : ${ov.head.slice(0, 110)}`);

ws.close();
browser.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {}
process.exit(0);
