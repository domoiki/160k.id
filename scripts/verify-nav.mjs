/**
 * Desktop nav — interaction scenarios.
 *
 * "Products" is the only nav item with children, so it is the only flyout on
 * the site. This walks the four ways a user can reach it and asserts each one
 * behaves, because the bug that broke it was invisible to any single check:
 * a pointer click focuses a control on mousedown, so opening on focus and
 * toggling on click opened and shut the menu inside one gesture.
 *
 *   hover        → opens, and stays open while the pointer travels to it
 *   keyboard     → opens on Tab focus, closes on Escape, focus returns
 *   click        → navigates to /products
 *   traverse     → tabbing past an open flyout closes it
 *
 * Uses Input.dispatchMouseEvent and Input.dispatchKeyEvent so the events are
 * trusted; an unhydrated page swallows them all identically, which would look
 * exactly like a broken menu.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9349;
const BASE = process.argv[2] ?? "http://localhost:3951/";

const profile = mkdtempSync(join(tmpdir(), "nav-profile-"));
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

/* The trigger is a link, not a button — that change is the fix. */
const STATE = String.raw`
(() => {
  const trig = [...document.querySelectorAll("header nav a")]
    .find(a => a.textContent.trim().startsWith("Products"));
  if (!trig) return JSON.stringify({ error: "Products trigger not found" });
  const panel = trig.parentElement.querySelector(".xk-panel");
  const r = panel?.getBoundingClientRect();
  return JSON.stringify({
    open: trig.getAttribute("aria-expanded") === "true",
    href: trig.getAttribute("href"),
    linkCount: panel ? panel.querySelectorAll("a").length : 0,
    panelVisible: !!r && r.width > 0 && r.height > 0,
    topIsPanelLink: !!(r && (() => {
      const t = document.elementFromPoint(Math.round(r.left + r.width/2), Math.round(r.top + 20));
      return t && panel.contains(t);
    })()),
    focused: document.activeElement?.textContent?.trim().slice(0, 24) ?? null,
    pathname: location.pathname,
  });
})()
`;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: BASE });

await evalRaw(String.raw`
(async () => {
  const trig = () => [...document.querySelectorAll("header nav a")]
    .find(a => a.textContent.trim().startsWith("Products"));
  /* Hydrated means React has attached its listeners. Layout stability alone is
     not enough: before hydration the trigger is fully laid out and looks
     perfect, and every hover and click silently does nothing — which reads as
     a broken menu. Wait for the fiber as well as for a settled layout. */
  const hydrated = () => {
    const t = trig();
    if (!t) return false;
    for (let n = t; n && n !== document.documentElement; n = n.parentElement) {
      if (Object.keys(n).some(k => k.startsWith("__reactFiber") || k.startsWith("_reactRootContainer"))) return true;
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

const triggerPoint = await evaluate(String.raw`
(() => {
  const trig = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  const r = trig.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) });
})()
`);
const { x, y } = triggerPoint;

const move = async (px, py) => {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: px, y: py, buttons: 0 });
};
const click = async (px, py) => {
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: px, y: py, button: "left", clickCount: 1, buttons: 1 });
  await sleep(60);
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: px, y: py, button: "left", clickCount: 1, buttons: 0 });
};
const key = async (k, code, vk) => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: k, code, windowsVirtualKeyCode: vk });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code, windowsVirtualKeyCode: vk });
};

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
};

/* ---------- 1. hover opens it, and it survives the trip down ---------- */
await move(20, 600);
await sleep(150);
await move(x, y);
await sleep(450);
let s = await evaluate(STATE);
check("hover opens the flyout", s.open && s.panelVisible && s.linkCount === 6, `links=${s.linkCount} visible=${s.panelVisible}`);

const panelPoint = s.open ? await evaluate(String.raw`
(() => {
  const trig = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  const p = trig.parentElement.querySelector(".xk-panel").getBoundingClientRect();
  return JSON.stringify({ x: Math.round(p.left + p.width/2), y: Math.round(p.top + 20) });
})()
`) : null;

if (panelPoint) {
  await move(panelPoint.x, panelPoint.y);
  await sleep(500);
  s = await evaluate(STATE);
  check("stays open while the pointer crosses to it", s.open, `open=${s.open}`);
  check("panel is not covered by anything", s.topIsPanelLink, `topIsPanelLink=${s.topIsPanelLink}`);
} else {
  check("stays open while the pointer crosses to it", false, "no panel to travel to");
  check("panel is not covered by anything", false, "no panel to travel to");
}

/* ---------- 2. click goes to /products ----------
   Start from a closed flyout and an explicit move onto the trigger, so the
   assertion is about the click rather than about where the pointer was left. */
await move(20, 600);
await sleep(500);
await move(x, y);
await sleep(350);
await click(x, y);
/* Poll rather than sleep: on a cold dev server the first hit at /products
   compiles that route on demand and takes seconds. A fixed 1.5s wait called a
   working click broken. */
let navigated = false;
for (let i = 0; i < 20; i++) {
  await sleep(400);
  if ((await evaluate(STATE)).pathname === "/products") { navigated = true; break; }
}
check("clicking the trigger navigates to /products", navigated, `pathname=${(await evaluate(STATE)).pathname}`);

/* back to home for the keyboard run */
await send("Page.navigate", { url: BASE });
await sleep(5000);
/* ---------- 3. keyboard: focus opens, Escape closes, focus returns ----------
   Tab forward until the trigger actually has focus rather than assuming how
   many focusable elements precede it — that count is an implementation detail
   and changed silently once the trigger became a link. */
let tabs = 0;
let landed = false;
for (; tabs < 12; tabs++) {
  await key("Tab", "Tab", 9);
  await sleep(120);
  const cur = await evalRaw(String.raw`
(() => {
  const trig = [...document.querySelectorAll("header nav a")].find(a => a.textContent.trim().startsWith("Products"));
  return String(document.activeElement === trig);
})()
`);
  if (cur === "true") { landed = true; break; }
}
await sleep(450);
s = await evaluate(STATE);
check("keyboard focus opens the flyout", landed && s.open && s.linkCount === 6, `after ${tabs + 1} tabs, open=${s.open}, links=${s.linkCount}`);

await key("Escape", "Escape", 27);
await sleep(450);
s = await evaluate(STATE);
check("Escape closes it and keeps focus on the trigger", !s.open && (s.focused ?? "").startsWith("Products"), `open=${s.open} focused=${s.focused}`);

/* ---------- 4. tabbing away closes it ---------- */
await key("Tab", "Tab", 9);
await sleep(500);
s = await evaluate(STATE);
check("tabbing past the open flyout closes it", !s.open, `open=${s.open}`);

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
