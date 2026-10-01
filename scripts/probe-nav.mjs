/**
 * Desktop nav dropdown probe.
 *
 * "Products" is the only nav item with children, so it is the only dropdown on
 * the site. Reports what actually happens on hover and on a real click: does
 * the panel exist, where is it, and what element is on top of it.
 *
 * Uses Input.dispatchMouseEvent rather than element.click() so the events are
 * trusted — an unhydrated page swallows both identically, and the difference
 * matters when deciding whether a failure is a layout bug or a hydration one.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9345;
const BASE = process.argv[2] ?? "http://127.0.0.1:3951/";

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

const evaluateRaw = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text ?? "evaluate failed");
  return r.result?.value;
};

const evaluate = async (expression) => JSON.parse(await evaluateRaw(expression));

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: BASE });

/* Wait for hydration, not just for load: a trusted click on a server-rendered
   page does nothing until React has attached its listeners, and that silence
   is indistinguishable from a broken menu if you only test before it. */
/* Wait for the route to compile and render the button. Probing straight after
   navigate races the dev server, and a missing button then reads as "the menu
   is broken" rather than "nothing has loaded yet". */
await evaluateRaw(String.raw`
(async () => {
  const find = () => [...document.querySelectorAll("header nav button")]
    .some(b => b.textContent.trim().startsWith("Products"));
  const deadline = Date.now() + 30000;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  while (Date.now() < deadline) {
    await document.fonts.ready.catch(() => {});
    if (find()) {
      let stable = 0, last = -1;
      for (let i = 0; i < 10 && stable < 3; i++) {
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

const REPORT = String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")]
    .find(b => b.textContent.trim().startsWith("Products"));
  if (!btn) return JSON.stringify({ error: "Products button not found" });

  const open = btn.getAttribute("aria-expanded");
  const wrapper = btn.parentElement;
  /* Look the panel up by its own class. Selecting "the first div" returned the
     positioning wrapper, which never carries xk-panel, and reported the panel
     as absent even while aria-expanded said it was open. */
  const panel = wrapper.querySelector(".xk-panel");

  const out = {
    ariaExpanded: open,
    panelInDom: !!panel,
    buttonRect: btn.getBoundingClientRect().toJSON(),
  };

  if (panel) {
    const r = panel.getBoundingClientRect();
    const cs = getComputedStyle(panel);
    const midX = Math.round(r.left + r.width / 2);
    const midY = Math.round(r.top + r.height / 2);
    const top = document.elementFromPoint(midX, midY);

    /* Walk ancestors looking for anything that clips the panel away. */
    const clippedBy = [];
    for (let n = panel; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.overflow !== "visible" || s.overflowX !== "visible" || s.overflowY !== "visible") {
        clippedBy.push(n.tagName.toLowerCase() + "." + String(n.className).split(" ").slice(0,3).join(".")
          + " overflow=" + s.overflow + "/" + s.overflowX + "/" + s.overflowY);
      }
    }

    out.panelRect = { left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) };
    out.panelVisible = r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.opacity !== "0";
    out.linkCount = panel.querySelectorAll("a").length;
    out.firstLinkHref = panel.querySelector("a")?.getAttribute("href") ?? null;
    out.centrePoint = [midX, midY];
    out.onTop = top ? top.tagName.toLowerCase() + "." + String(top.className).split(" ").slice(0,4).join(".") : "nothing";
    out.topIsInsidePanel = !!(top && panel.contains(top));
    out.clippedBy = clippedBy;
    /* Stacking: what ends up above the panel, header included. */
    const headerCS = getComputedStyle(document.querySelector("header"));
    out.header = { position: headerCS.position, zIndex: headerCS.zIndex, overflow: headerCS.overflow, height: Math.round(document.querySelector("header").getBoundingClientRect().height) };
  }
  return JSON.stringify(out);
})()
`;

const buttonCenter = await evaluate(String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  const r = btn.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) });
})()
`);
const { x, y } = buttonCenter;

const step = async (label) => {
  await sleep(500);
  console.log(`--- ${label} ---`);
  console.log(JSON.stringify(await evaluate(REPORT), null, 2));
  console.log("");
};

await step("before any interaction");

/* press and release separately: a real click raises focus on mousedown and
   click on mouseup, so splitting them is the only way to see which one opens
   the menu and which one closes it again. */
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 600, buttons: 0 });
await sleep(150);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
await step("after hover");

const focusState = await evaluate(String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  return JSON.stringify({ isFocused: document.activeElement === btn, focusVisible: btn.matches(":focus-visible") });
})()
`);
console.log("  focus before click:", focusState, "\n");

/* A single snapshot cannot tell "never opened" from "opened and closed again".
   Install the observer first, then drive the click from CDP, then read the
   timeline — otherwise the transition being measured has already happened. */
await evaluate(String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  const wrap = btn.parentElement;
  window.__log = [];
  window.__t0 = performance.now();
  const stamp = (e) => window.__log.push({
    at: Math.round(performance.now() - window.__t0),
    type: e.type,
    on: e.target === btn ? "button" : (e.target === wrap ? "wrapper" : e.target.tagName.toLowerCase()),
    rel: e.relatedTarget ? e.relatedTarget.tagName.toLowerCase() : null,
  });
  /* Capture phase: mouseenter/mouseleave do not bubble, so a bubble-phase
     listener on the wrapper would miss exactly the events in question. */
  for (const type of ["mouseenter", "mouseleave", "mouseover", "mouseout",
                      "mousedown", "mouseup", "click", "focusin", "focusout"]) {
    wrap.addEventListener(type, stamp, true);
  }
  window.__obs = new MutationObserver(() => {
    window.__log.push({ at: Math.round(performance.now() - window.__t0), type: "ARIA", to: btn.getAttribute("aria-expanded") });
  });
  window.__obs.observe(btn, { attributes: true, attributeFilter: ["aria-expanded"] });
  return JSON.stringify({ armed: true });
})()
`);

await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 20, y: 600, buttons: 0 });
await sleep(120);
await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
await sleep(200);
await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1, buttons: 1 });
await sleep(80);
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1, buttons: 0 });
await sleep(900);

const timeline = await evaluate(String.raw`
(() => {
  window.__obs.disconnect();
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  return JSON.stringify({
    events: window.__log,
    final: btn.getAttribute("aria-expanded"),
    panelInDom: !!btn.parentElement.querySelector(".xk-panel"),
  });
})()
`);
console.log("  event timeline (hover + click):");
for (const e of timeline.events) {
  console.log(`    ${String(e.at).padStart(5)}ms  ${e.type.padEnd(11)} on=${e.on.padEnd(8)} rel=${e.rel ?? "-"}${e.to ? " -> " + e.to : ""}`);
}

/* Move down toward the panel the way a pointer actually travels. */
const panelPoint = await evaluate(String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  const panel = btn.parentElement.querySelector(".xk-panel");
  if (!panel) return "null";
  const r = panel.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 24) });
})()
`);
if (panelPoint !== "null") {
  const p = JSON.parse(panelPoint);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y, buttons: 0 });
  await step("pointer moved onto the panel");
} else {
  console.log("pointer never reached a panel — nothing to travel to");
}

ws.close();
browser.kill();
await sleep(300);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* best effort */
}
process.exit(0);
