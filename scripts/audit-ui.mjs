/**
 * UI/UX audit via the Chrome DevTools Protocol.
 *
 * Measures the rendered page rather than the source: overflow, tap-target
 * size, text contrast, heading order, measure length and accessible names.
 * Same philosophy as verify-hydration.mjs — headless Edge over CDP using Node's
 * built-in WebSocket, so nothing has to be added to dependencies.
 *
 *   node scripts/audit-ui.mjs http://127.0.0.1:3951/
 *   node scripts/audit-ui.mjs http://127.0.0.1:3951/ --vp=mobile
 *
 * Exits non-zero when a hard finding is present, so it can gate a commit.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9339;
const BASE = process.argv[2] ?? "http://127.0.0.1:3951/";
const onlyVp = process.argv.find((a) => a.startsWith("--vp="))?.slice(5);
const onlyRoute = process.argv.find((a) => a.startsWith("--route="))?.slice(7);

const ROUTES = ["/", "/products", "/products/a2p-messaging", "/api", "/about", "/contact"];
const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "tablet", width: 834, height: 1112, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
];

/* Runs inside the page. Returns a JSON string so returnByValue can carry it. */
const AUDIT = String.raw`
(() => {
  const out = { overflow: null, offscreen: [], tapTargets: [], tinyTargets: [], shrunk: [],
                trappedFocus: [], tinyText: [], contrast: [], headings: [], unnamed: [],
                noAlt: [], measure: [],
                bodyOverflowX: getComputedStyle(document.body).overflowX };

  const sel = (el) => {
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const cls = (typeof el.className === "string" && el.className.trim())
      ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "";
    const txt = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return tag + id + cls + (txt ? ' «' + txt + '»' : '');
  };

  /* ---------- colour helpers ---------- */
  const parse = (c) => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };

  /* Effective background behind an element: composite alpha up the tree.
     Returns null when a gradient or image is in the path, because a flat
     number would be a guess. */
  const bgOf = (el) => {
    const stack = [];
    let node = el;
    while (node && node !== document.documentElement.parentNode) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) {
        stack.push(c);
        if (c.a === 1) break;
      }
      node = node.parentElement;
    }
    stack.push({ r: 5, g: 7, b: 12, a: 1 }); // page base, matches --color-void
    let acc = stack[stack.length - 1];
    for (let i = stack.length - 2; i >= 0; i--) acc = over(stack[i], acc);
    return acc;
  };

  /* ---------- overflow ----------
     body sets overflow-x:hidden, which hides real overflow rather than
     fixing it. Lift it first so what we measure is what a user would hit. */
  const prevOX = document.documentElement.style.overflowX;
  const prevBX = document.body.style.overflowX;
  document.documentElement.style.overflowX = "visible";
  document.body.style.overflowX = "visible";

  const vw = document.documentElement.clientWidth;
  const scrollW = document.documentElement.scrollWidth;
  if (scrollW > vw + 1) {
    out.overflow = { scrollW, vw, by: scrollW - vw };
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed") continue;
        out.offscreen.push({
          sel: sel(el),
          left: Math.round(r.left),
          right: Math.round(r.right),
          position: cs.position,
        });
        if (out.offscreen.length >= 8) break;
      }
    }
  }
  document.documentElement.style.overflowX = prevOX;
  document.body.style.overflowX = prevBX;

  /* ---------- interactive targets ----------
     WCAG 2.2 SC 2.5.8 sets the floor at 24x24 CSS px (AA); 44x44 is the
     comfort target from 2.5.5 (AAA) and the Apple HIG. Reporting one flat
     "< 44" bucket would cry wolf over the 30px range, so the two are kept
     apart. */
  const INTERACTIVE = 'a[href], button, input, select, textarea, [role="button"], [onclick]';
  for (const el of document.querySelectorAll(INTERACTIVE)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    /* Visually-hidden helpers (the skip link is sr-only until focused) are
       1x1 by definition. Measuring them is measuring the technique. */
    if (r.width <= 2 && r.height <= 2) continue;

    /* A control whose declared height does not survive layout is a different
       failure from one that was simply authored too small, and it is the more
       dangerous of the two: it looks correct in review and is unusable on a
       phone. Compare against the Tailwind spacing scale the class names. */
    const declared = [...el.classList]
      .map((c) => /^h-(\d+)$/.exec(c))
      .find(Boolean);
    if (declared) {
      const expected = Number(declared[1]) * 4;
      if (r.height < expected - 1) {
        out.shrunk.push({
          sel: sel(el),
          declared: "h-" + declared[1] + " (" + expected + "px)",
          rendered: Math.round(r.height),
        });
      }
    }

    /* Inline links inside running prose are exempt: padding them out to 44px
       would wreck the paragraph. Anything block-level is a real control. */
    const inline = el.tagName === "A" && cs.display.startsWith("inline") && r.height < 32;
    if (inline) continue;

    const entry = { sel: sel(el), w: Math.round(r.width), h: Math.round(r.height) };
    if (r.width < 24 || r.height < 24) out.tinyTargets.push(entry);
    else if (r.width < 44 || r.height < 44) out.tapTargets.push(entry);

    const name = (el.getAttribute("aria-label") || el.textContent || "").trim()
      || (el.labels && el.labels.length ? [...el.labels].map(l => l.textContent).join(" ").trim() : "")
      || (el.getAttribute("title") || "").trim()
      || (el.getAttribute("placeholder") || "").trim();
    if (!name) out.unnamed.push({ sel: sel(el), tag: el.tagName.toLowerCase() });
  }

  /* ---------- keyboard reachability of collapsed UI ----------
     An off-screen panel that is still focusable is a keyboard trap, and
     measuring the rendered page cannot see it — only focus order can. */
  out.trappedFocus = [];
  for (const panel of document.querySelectorAll('[id][aria-expanded], [id][aria-controls]')) {
    const controller = document.querySelector('[aria-controls="' + panel.id + '"]');
    const expanded = controller?.getAttribute("aria-expanded");
    if (expanded !== "false") continue;
    const cs = getComputedStyle(panel);
    const collapsed = panel.getBoundingClientRect().height < 2 || cs.maxHeight === "0px";
    if (!collapsed) continue;
    const reachable = [...panel.querySelectorAll("a[href], button, input, select, textarea")]
      .filter((n) => !n.closest("[inert]") && !n.hasAttribute("inert")).length;
    if (reachable > 0) {
      out.trappedFocus.push({
        panel: "#" + panel.id,
        reachable,
        inert: panel.hasAttribute("inert"),
      });
    }
  }

  /* ---------- text size, contrast, measure ---------- */
  for (const el of document.querySelectorAll("body *")) {
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!direct) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const fs = parseFloat(cs.fontSize);
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    /* Visually-hidden helpers are clipped to a 1px box: they have no layout
       measure to report, so they are skipped before size and measure checks. */
    if (r.width <= 2 && r.height <= 2) continue;

    if (fs < 11) {
      out.tinyText.push({ sel: sel(el), size: +fs.toFixed(1), color: cs.color });
    }

    const fg = parse(cs.color);
    const bg = bgOf(el);
    if (fg && bg) {
      const effective = fg.a < 1 ? over(fg, bg) : fg;
      const cr = ratio(effective, bg);
      const weight = parseInt(cs.fontWeight, 10) || 400;
      const large = fs >= 24 || (fs >= 18.66 && weight >= 700);
      const need = large ? 3 : 4.5;
      if (cr < need) {
        out.contrast.push({
          sel: sel(el),
          size: +fs.toFixed(1),
          weight,
          ratio: +cr.toFixed(2),
          need,
          color: cs.color,
        });
      }
    }

    /* Measure: only for real prose blocks, capped at a comfortable width. */
    const tag = el.tagName;
    if ((tag === "P" || tag === "LI" || tag === "DD") && fs >= 15) {
      const chars = el.textContent.trim().length;
      if (chars > 60) {
        const cpl = Math.round(chars / (r.width / (fs * 0.5)));
        if (cpl > 95) out.measure.push({ sel: sel(el), cpl, chars });
      }
    }
  }

  /* ---------- heading order ---------- */
  const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
    .filter(h => h.getBoundingClientRect().height > 0)
    .map(h => ({ level: Number(h.tagName[1]), sel: sel(h) }));
  out.headings = levels;
  let prev = 0;
  for (const h of levels) {
    if (prev && h.level > prev + 1) {
      out.headings.push({ skipped: true, from: prev, to: h.level, sel: h.sel });
    }
    prev = h.level;
  }
  out.h1Count = levels.filter(h => h.level === 1).length;

  /* ---------- images ---------- */
  for (const img of document.querySelectorAll("img")) {
    if (!img.hasAttribute("alt")) out.noAlt.push({ sel: sel(img), src: img.getAttribute("src") });
  }

  return JSON.stringify(out);
})()
`;

const profile = mkdtempSync(join(tmpdir(), "audit-profile-"));
const browser = spawn(
  EDGE,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    "--disable-gpu",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("CDP endpoint never became available");
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? {});
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

/* Readiness gate.
 *
 * A fixed sleep after Page.navigate is not enough: on a cold route Turbopack
 * still compiles, the tree has not hydrated, and every measurement taken in
 * that window is garbage. The first run of this script reported the entire
 * homepage rendering at a third of its declared height because of exactly
 * that — a false alarm indistinguishable from a real layout defect.
 *
 * Instead: wait for load, for fonts, for an <h1>, and for the document height
 * to stop moving across three consecutive samples. Only then measure. */
const WAIT_STABLE = String.raw`
(async () => {
  const deadline = Date.now() + 25000;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let stable = 0, last = -1;
  while (Date.now() < deadline) {
    if (document.readyState === "complete" && document.fonts.status === "loaded"
        && document.querySelector("h1")) {
      const h = document.documentElement.scrollHeight;
      stable = h === last ? stable + 1 : 0;
      last = h;
      if (stable >= 3) return "stable";
    }
    await sleep(200);
  }
  return "timeout";
})()
`;

await send("Page.enable");
await send("Runtime.enable");

const findings = [];

for (const vp of VIEWPORTS.filter((v) => !onlyVp || v.name === onlyVp)) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: 1,
    mobile: vp.mobile,
  });

  for (const route of ROUTES.filter((r) => !onlyRoute || r === onlyRoute)) {
    await send("Page.navigate", { url: BASE.replace(/\/$/, "") + route });

    const ready = await send("Runtime.evaluate", {
      expression: WAIT_STABLE,
      returnByValue: true,
      awaitPromise: true,
    });
    if (ready.result?.value !== "stable") {
      findings.push({
        vp: vp.name,
        route,
        kind: "PAGE-NOT-SETTLED",
        detail: `layout never stabilised within 25s (${ready.result?.value ?? "no result"}); measurements would be unreliable`,
        sev: "error",
      });
      continue;
    }

    const res = await send("Runtime.evaluate", {
      expression: AUDIT,
      returnByValue: true,
    });

    if (!res.result?.value) {
      findings.push({
        vp: vp.name,
        route,
        kind: "AUDIT-FAILED",
        detail: res.exceptionDetails?.text ?? "no result",
        sev: "error",
      });
      continue;
    }

    const a = JSON.parse(res.result.value);
    const add = (kind, detail, sev = "warn") => {
      findings.push({ vp: vp.name, route, kind, detail, sev });
    };

    if (a.overflow) add("H-OVERFLOW", `document is ${a.overflow.by}px wider than the viewport`, "error");
    a.offscreen.forEach((o) => add("H-OFFSCREEN", `${o.sel} → left ${o.left}, right ${o.right}`, "error"));

    if (a.tinyTargets.length)
      add("TARGET-SIZE-AA", a.tinyTargets.map((t) => `${t.sel} ${t.w}×${t.h}`).join(" · "), "error");
    if (a.shrunk.length)
      add("TARGET-SHRUNK", a.shrunk.map((t) => `${t.sel} declares ${t.declared}, renders ${t.rendered}px`).join(" · "), "error");
    if (a.trappedFocus.length)
      add("TRAPPED-FOCUS", a.trappedFocus.map((t) => `${t.panel} is collapsed but ${t.reachable} controls inside stay focusable`).join(" · "), "error");
    if (a.tapTargets.length)
      add("TARGET-SIZE-AAA", a.tapTargets.map((t) => `${t.sel} ${t.w}×${t.h}`).join(" · "), "warn");

    if (a.tinyText.length)
      add("TINY-TEXT", [...new Set(a.tinyText.map((t) => `${t.sel} ${t.size}px`))].slice(0, 6).join(" · "), "warn");

    if (a.contrast.length)
      add("CONTRAST", a.contrast.map((c) => `${c.sel} ${c.ratio}:1 (need ${c.need}) ${c.color}`).slice(0, 6).join(" · "), "error");

    if (a.measure.length)
      add("MEASURE", a.measure.map((m) => `${m.sel} ~${m.cpl}cpl`).join(" · "), "warn");

    const skipped = a.headings.filter((h) => h.skipped);
    if (skipped.length)
      add("HEADING-SKIP", skipped.map((h) => `h${h.from} → h${h.to} at ${h.sel}`).join(" · "), "warn");
    if (a.h1Count !== 1)
      add("H1-COUNT", `${a.h1Count} <h1> on the page`, a.h1Count === 0 ? "error" : "warn");

    if (a.unnamed.length)
      add("NO-ACCESSIBLE-NAME", a.unnamed.map((u) => u.sel).join(" · "), "error");
    if (a.noAlt.length)
      add("IMG-NO-ALT", a.noAlt.map((i) => `${i.src}`).join(" · "), "warn");

    if (a.bodyOverflowX !== "hidden")
      add("NOTE", `body overflow-x is "${a.bodyOverflowX}", expected hidden to mask decorative bleed`, "info");
  }
}

ws.close();
browser.kill();
await sleep(400);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* best effort */
}

const order = { error: 0, warn: 1, info: 2 };
findings.sort((a, b) => order[a.sev] - order[b.sev] || a.route.localeCompare(b.route));

let currentKey = null;
for (const f of findings) {
  const key = `${f.vp} ${f.route}`;
  if (key !== currentKey) {
    currentKey = key;
    console.log(`\n=== ${key} ===`);
  }
  const tag = f.sev === "error" ? "ERR " : f.sev === "warn" ? "warn" : "info";
  console.log(`  [${tag}] ${f.kind}: ${f.detail}`);
}

const errors = findings.filter((f) => f.sev === "error").length;
const warns = findings.filter((f) => f.sev === "warn").length;
console.log(`\n${findings.length} findings — ${errors} error, ${warns} warn`);
process.exit(errors ? 1 : 0);
