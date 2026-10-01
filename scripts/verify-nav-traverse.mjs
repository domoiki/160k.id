/**
 * Flyout traversal — does the menu survive the trip from trigger to panel?
 *
 * `verify-nav.mjs` proves the flyout opens, that a click navigates, and that
 * Escape closes. All of that passed while the menu was still unusable by hand,
 * because those checks move the pointer to the panel in one jump. A real pointer
 * crosses the 12px band between the trigger and the panel, and that crossing is
 * where the menu died.
 *
 * Measured before the fix, on the same build:
 *
 *   mouseleave  fired at   5ms
 *   closed      at 154ms
 *   gap         12px  (trigger bottom 56 -> panel top 68)
 *
 * 140ms of grace cannot cover a 12px crossing, so the menu always vanished
 * before the pointer arrived. This script walks the gap in steps, the way a hand
 * does, and asserts the flyout is still open at every step.
 *
 * Usage: node scripts/verify-nav-traverse.mjs http://127.0.0.1:3960/
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9351;
const BASE = process.argv[2] ?? "http://localhost:3951/";

const profile = mkdtempSync(join(tmpdir(), "nav-traverse-"));
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

const OPEN = String.raw`document.querySelector("header nav a[aria-expanded=true]") !== null`;

/* Wait for hydration, not just for layout. Before hydration every hover is a
   no-op and the page looks identical to a menu that is working. */
const ready = await evalRaw(String.raw`
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
if (ready !== "ready") {
  console.error(`  page never became ready (${ready}) — cannot assert on an unhydrated menu`);
  ws.close();
  browser.kill();
  process.exit(1);
}

const geom = await evaluate(String.raw`
(() => {
  const t = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  const r = t.getBoundingClientRect();
  return JSON.stringify({
    x: Math.round(r.left + r.width / 2),
    y: Math.round(r.top + r.height / 2),
    bottom: Math.round(r.bottom),
  });
})()
`);
const { x, y, bottom } = geom;

const move = (px, py) => send("Input.dispatchMouseEvent", { type: "mouseMoved", x: px, y: py, buttons: 0 });

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

/* ---------- 1. open on the trigger ---------- */
await move(5, 400);
await sleep(200);
await move(x, y);
await sleep(350);
check("hovering the trigger opens the flyout", await evalRaw(OPEN));

/* ---------- 2. the crossing ----------
   Walk down one pixel-band at a time from the trigger to the panel. Every step
   is a separate trusted mouse event with a real gap in between, so the close
   timer has to be re-armed and cancelled the way it is under a real hand. */
const panelTop = await evaluate(String.raw`
(() => {
  const t = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  const p = t.parentElement.querySelector(".xk-panel");
  return p ? Math.round(p.getBoundingClientRect().top) : null;
})()
`);

let survived = true;
let firstFailure = null;
const steps = [];
for (let py = bottom + 1; py <= panelTop; py += 2) {
  await move(x, py);
  await sleep(120); /* slower than a flick; a hand does not teleport */
  const open = await evalRaw(OPEN);
  steps.push(`${py}:${open ? "open" : "CLOSED"}`);
  if (!open) {
    survived = false;
    firstFailure = py;
    break;
  }
}
check(
  "the flyout survives the gap between trigger and panel",
  survived,
  survived ? `${steps.length} steps, ${bottom}->${panelTop}px` : `closed at y=${firstFailure}, trigger bottom ${bottom}`,
);

/* ---------- 3. it must still close when genuinely leaving ---------- */
await move(x, y + 2);
await sleep(150);
await move(5, 500);
await sleep(700);
check("leaving for real still closes the flyout", !(await evalRaw(OPEN)));

ws.close();
browser.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* best effort */
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} scenarios passed`);
process.exit(failed.length ? 1 : 0);