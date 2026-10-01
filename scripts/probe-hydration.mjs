/**
 * Is the page actually interactive, and is the dropdown the thing that's broken?
 *
 * Two separable questions, easily confused:
 *   1. Is React hydrated and handling events at all?
 *   2. Does the Products dropdown open when it is?
 *
 * Scroll state is the control: it is a useEffect in the same client component
 * as the dropdown, so if scrolling restyles the header, events and state are
 * working and any dropdown failure is specific to the dropdown.
 *
 * Also compares 127.0.0.1 against localhost, because Next.js dev blocks dev
 * resources crossing origins and that failure looks exactly like dead JS.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9347;
const ORIGINS = (process.argv[2] ?? "http://localhost:3951,http://127.0.0.1:3951").split(",");

const profile = mkdtempSync(join(tmpdir(), "hyd-profile-"));
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
const consoleErrors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? {});
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
    consoleErrors.push((msg.params.args ?? []).map((a) => a.value ?? a.description ?? "").join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleErrors.push("EXCEPTION: " + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
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
  if (r.exceptionDetails) return { __error: r.exceptionDetails.text };
  return { __value: r.result?.value };
};

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

for (const origin of ORIGINS) {
  consoleErrors.length = 0;
  await send("Page.navigate", { url: origin + "/" });
  await sleep(6000);

  /* --- 1. did the client JS even load and hydrate? --- */
  const chunkCheck = await evalRaw(String.raw`
(async () => {
  await document.fonts.ready.catch(() => {});
  const scripts = [...document.querySelectorAll("script[src]")].map(s => s.src);
  const nav = document.querySelector("header nav");
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  /* React 19 marks hydrated roots with a fiber key somewhere up the tree. */
  let hasFiber = false;
  for (let n = btn; n && n !== document.documentElement; n = n.parentElement) {
    if (Object.keys(n).some(k => k.startsWith("__reactFiber") || k.startsWith("_reactRootContainer"))) { hasFiber = true; break; }
  }
  return JSON.stringify({
    scriptCount: scripts.length,
    scriptOrigins: [...new Set(scripts.map(s => { try { return new URL(s).host; } catch { return "?"; } }))],
    hasButton: !!btn,
    hasFiber,
    headerClass: document.querySelector("header")?.className.includes("backdrop-blur") ?? null,
  });
})()
`);
  console.log(`=== ${origin} ===`);
  console.log("  after load :", chunkCheck.__value ?? JSON.stringify(chunkCheck));

  /* --- 2. control: does scroll state update? Same component, useEffect. --- */
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, 400)" });
  await sleep(700);
  const afterScroll = await evalRaw(String.raw`
JSON.stringify({
  scrollY: Math.round(window.scrollY),
  headerHasBlur: document.querySelector("header")?.className.includes("backdrop-blur-xl") ?? null
})
`);
  console.log("  after scroll:", afterScroll.__value);
  await send("Runtime.evaluate", { expression: "window.scrollTo(0, 0)" });
  await sleep(400);

  /* --- 3. the dropdown itself --- */
  const centre = await evalRaw(String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  if (!btn) return "null";
  const r = btn.getBoundingClientRect();
  return JSON.stringify({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) });
})()
`);
  if (centre.__value === "null" || centre.__error) {
    console.log("  dropdown    : Products button not found");
  } else {
    const { x, y } = JSON.parse(centre.__value);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons: 0 });
    await sleep(400);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1, buttons: 1 });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1, buttons: 0 });
    await sleep(600);
    const dd = await evalRaw(String.raw`
(() => {
  const btn = [...document.querySelectorAll("header nav button")].find(b => b.textContent.trim().startsWith("Products"));
  const panel = btn.parentElement.querySelector(".xk-panel");
  return JSON.stringify({
    ariaExpanded: btn.getAttribute("aria-expanded"),
    panelInDom: !!panel,
    linkCount: panel ? panel.querySelectorAll("a").length : 0,
  });
})()
`);
    console.log("  after click :", dd.__value);
  }

  console.log("  console errs:", consoleErrors.slice(0, 4).join(" | ") || "(none)");
  console.log("");
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
