/**
 * Screenshot capture via the Chrome DevTools Protocol.
 *
 * Same approach as verify-hydration.mjs — Node's built-in WebSocket, no added
 * dependency — but this one produces PNGs so a layout can be looked at instead
 * of asserted about. Used during UI/UX review passes.
 *
 *   node scripts/shoot.mjs http://127.0.0.1:3951/            # all routes
 *   node scripts/shoot.mjs http://127.0.0.1:3951/ --only=/    # one route
 *   node scripts/shoot.mjs http://127.0.0.1:3951/ --vp=mobile
 */
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const OUT = ".shots";
const PORT = 9337;
const BASE = process.argv[2] ?? "http://127.0.0.1:3951/";
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const onlyVp = process.argv.find((a) => a.startsWith("--vp="))?.slice(5);

/* Every route the sitemap advertises, so coverage cannot silently drift. */
const ROUTES = [
  "/",
  "/products",
  "/products/a2p-messaging",
  "/api",
  "/about",
  "/contact",
  "/does-not-exist",
];

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844, dsf: 2, mobile: true },
  { name: "tablet", width: 834, height: 1112, dsf: 2, mobile: true },
  { name: "desktop", width: 1440, height: 900, dsf: 1, mobile: false },
];

const vpList = onlyVp ? VIEWPORTS.filter((v) => v.name === onlyVp) : VIEWPORTS;
const routeList = only ? ROUTES.filter((r) => r === only) : ROUTES;

mkdirSync(OUT, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), "shoot-profile-"));
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

await send("Page.enable");
await send("Runtime.enable");

const report = [];

for (const vp of vpList) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.width,
    height: vp.height,
    deviceScaleFactor: vp.dsf,
    mobile: vp.mobile,
  });

  for (const route of routeList) {
    const url = BASE.replace(/\/$/, "") + route;
    await send("Page.navigate", { url });
    await sleep(2200);

    // Settle lazy work: fonts, decode, scroll-triggered animation.
    await send("Runtime.evaluate", {
      expression: `document.fonts.ready.then(() => new Promise(r => {
        window.scrollTo(0, document.body.scrollHeight);
      }))`,
      awaitPromise: true,
    });
    await sleep(700);
    await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
    await sleep(400);

    const metrics = await send("Page.getLayoutMetrics");
    const { width, height } = metrics.cssContentSize ?? metrics.contentSize;

    const shot = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    });

    const slug = route === "/" ? "home" : route.replace(/\//g, "-").replace(/^-/, "");
    const file = join(OUT, `${slug}.${vp.name}.png`);
    writeFileSync(file, Buffer.from(shot.data, "base64"));

    const audit = await send("Runtime.evaluate", {
      expression: `JSON.stringify({
        docWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        height: Math.round(document.body.scrollHeight),
        h1: document.querySelectorAll('h1').length,
        title: document.title
      })`,
      returnByValue: true,
    });

    const a = JSON.parse(audit.result?.value ?? "{}");
    report.push({ route, vp: vp.name, file, ...a, overflow: a.docWidth > a.clientWidth + 1 });
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

console.log(JSON.stringify(report, null, 2));

const overflow = report.filter((r) => r.overflow);
console.log(`\n${report.length} shots -> ${OUT}/`);
console.log(
  overflow.length
    ? `HORIZONTAL OVERFLOW: ${overflow.map((r) => `${r.route}@${r.vp} (+${r.docWidth - r.clientWidth}px)`).join(", ")}`
    : "no horizontal overflow at any tested viewport",
);
process.exit(0);
