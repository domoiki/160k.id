/**
 * Flyout panel position — the fix must be invisible.
 *
 * Closing the hover gap changed the panel's positioning from a `top` offset to
 * padding. That is only a legitimate fix if the panel still renders in exactly
 * the same place: same centre, same width, same distance below the trigger, and
 * still fully on screen. This asserts those numbers rather than "looks right",
 * because a flyout that drifts 1px is a flyout someone will notice.
 *
 * Run with the panel open.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9352;
const BASE = process.argv[2] ?? "http://localhost:3951/";

/* Geometry before the fix, measured on the same build. If these three numbers
   still hold, the panel did not move. */
const EXPECT = {
  width: 480,
  centreOffsetFromTriggerCentre: 0,
  gapBelowTrigger: 12,
};

const profile = mkdtempSync(join(tmpdir(), "nav-pos-"));
const browser = spawn(
  EDGE,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--disable-extensions",
    "--no-first-run",
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

const evalRaw = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "evaluate failed");
  return r.result?.value;
};
const evaluate = async (expression) => JSON.parse(await evalRaw(expression));

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: BASE });

await evalRaw(String.raw`
(async () => {
  const trig = () => [...document.querySelectorAll("header nav a")]
    .find(a => a.textContent.trim().startsWith("Products"));
  const hydrated = () => {
    const t = trig();
    if (!t) return false;
    for (let n = t; n && n !== document.documentElement; n = n.parentElement) {
      if (Object.keys(n).some(k => k.startsWith("__reactFiber"))) return true;
    }
    return false;
  };
  const deadline = Date.now() + 30000;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  while (Date.now() < deadline) {
    await document.fonts.ready.catch(() => {});
    if (trig() && hydrated()) {
      let stable = 0, last = -1;
      for (let i = 0; i < 12 && stable < 3; i++) {
        const h = document.documentElement.scrollHeight;
        stable = h === last ? stable + 1 : 0;
        last = h;
        await sleep(200);
      }
      if (stable >= 3) return "ready";
    }
    await sleep(300);
  }
  return "timeout";
})()
`);

const trig = await evaluate(String.raw`
(() => {
  const t = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  const r = t.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
})()
`);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 400 });
await sleep(200);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: trig.x, y: trig.y });
await sleep(400);

const m = await evaluate(String.raw`
(() => {
  const t = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  const panel = t.parentElement.querySelector(".xk-panel");
  if (!panel) return JSON.stringify({ error: "panel not open" });
  const tr = t.getBoundingClientRect();
  const pr = panel.getBoundingClientRect();
  return JSON.stringify({
    width: Math.round(pr.width),
    centreOffset: Math.round((pr.left + pr.width / 2) - (tr.left + tr.width / 2)),
    gapBelowTrigger: Math.round(pr.top - tr.bottom),
    left: Math.round(pr.left),
    right: Math.round(pr.right),
    viewport: window.innerWidth,
    linkCount: panel.querySelectorAll("a").length,
    docScrollW: document.documentElement.scrollWidth,
    docClientW: document.documentElement.clientWidth,
  });
})()
`);

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

if (m.error) {
  console.error(`  ${m.error}`);
  ws.close();
  browser.kill();
  process.exit(1);
}

check("panel width unchanged", m.width === EXPECT.width, `${m.width}px (expected ${EXPECT.width})`);
check(
  "panel still centred on the trigger",
  Math.abs(m.centreOffset - EXPECT.centreOffsetFromTriggerCentre) <= 1,
  `offset ${m.centreOffset}px`,
);
check(
  "gap below trigger unchanged",
  m.gapBelowTrigger === EXPECT.gapBelowTrigger,
  `${m.gapBelowTrigger}px (expected ${EXPECT.gapBelowTrigger})`,
);
check("panel fully on screen", m.left >= 0 && m.right <= m.viewport, `left ${m.left}, right ${m.right}, viewport ${m.viewport}`);
check("all six products listed", m.linkCount === 6, `${m.linkCount} links`);
check("no horizontal overflow", m.docScrollW <= m.docClientW, `${m.docScrollW} vs ${m.docClientW}`);

ws.close();
browser.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* best effort */
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);