/**
 * Headless verification via the Chrome DevTools Protocol.
 *
 * Uses Node's built-in WebSocket (Node 22+) so there is no dependency to add.
 * Launches a clean browser profile with extensions disabled, so any hydration
 * warning reported here is caused by our own markup — not by a browser
 * extension injecting attributes into the DOM.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CDP_PORT = 9333;
const TARGET_URL = process.argv[2] ?? "http://127.0.0.1:3951/";

const profile = mkdtempSync(join(tmpdir(), "cdp-profile-"));
const browser = spawn(
  EDGE,
  [
    "--headless=new",
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    "--disable-extensions",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error("CDP endpoint never became available");
}

const page = await targets();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});

let id = 0;
const pending = new Map();
const console_ = [];
const exceptions = [];

ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result ?? {});
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args ?? [])
      .map((a) => a.value ?? a.description ?? a.unserializableValue ?? "")
      .join(" ");
    console_.push({ level: msg.params.type, text });
  }
  if (msg.method === "Runtime.exceptionThrown") {
    const d = msg.params.exceptionDetails;
    exceptions.push(d.exception?.description ?? d.text);
  }
  if (msg.method === "Log.entryAdded") {
    console_.push({ level: msg.params.entry.level, text: msg.params.entry.text });
  }
};

const send = (method, params = {}) =>
  new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");
await send("Page.navigate", { url: TARGET_URL });

// Give the app time to hydrate and any mismatch to be reported.
await sleep(9000);

// Also assert the page actually rendered meaningful content.
const evalRes = await send("Runtime.evaluate", {
  expression: `JSON.stringify({
    h1: document.querySelectorAll('h1').length,
    imgs: document.querySelectorAll('img').length,
    darkreader: document.documentElement.getAttribute('data-darkreader-proxy-injected'),
    title: document.title,
    navLinks: document.querySelectorAll('header a').length
  })`,
  returnByValue: true,
});

console.log("TARGET:", TARGET_URL);
console.log("DOM  :", evalRes.result?.value);
console.log("");

const hydration = console_.filter(
  (c) => /hydrat|did not match|didn't match|mismatch/i.test(c.text),
);
const evalErr = console_.filter((c) => /eval\(\)|unsafe-eval/i.test(c.text));
const otherErr = console_.filter(
  (c) => (c.level === "error" || c.level === "severe") && !hydration.includes(c) && !evalErr.includes(c),
);

console.log(`hydration warnings : ${hydration.length}`);
hydration.slice(0, 3).forEach((c) => console.log("   !", c.text.slice(0, 200)));
console.log(`eval/CSP errors    : ${evalErr.length}`);
evalErr.slice(0, 3).forEach((c) => console.log("   !", c.text.slice(0, 200)));
console.log(`other console errors: ${otherErr.length}`);
otherErr.slice(0, 5).forEach((c) => console.log("   !", c.text.slice(0, 200)));
console.log(`uncaught exceptions : ${exceptions.length}`);
exceptions.slice(0, 3).forEach((e) => console.log("   !", String(e).slice(0, 200)));

ws.close();
browser.kill();
await sleep(400);
try {
  rmSync(profile, { recursive: true, force: true });
} catch {
  /* best effort */
}
process.exit(0);
