/**
 * Hero overlap probe.
 *
 * The hero uses a 12-column grid where the copy spans 5. A grid item's default
 * `min-width: auto` is its min-content width, so a long word in a fluid
 * `clamp()` headline can be wider than its own track and spill over the
 * neighbouring panel. `section.overflow-hidden` clips that spill, which is
 * exactly why the horizontal-overflow check in audit-ui.mjs does not see it:
 * the document never gets wider, the text just lands on top of the panel.
 *
 * Sweeps viewport widths and reports actual intersections.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const PORT = 9343;
const BASE = process.argv[2] ?? "http://127.0.0.1:3951/";

const WIDTHS = [360, 390, 480, 640, 768, 834, 1024, 1152, 1280, 1440, 1680, 1920, 2560];

const profile = mkdtempSync(join(tmpdir(), "hero-profile-"));
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

await send("Page.enable");
await send("Runtime.enable");

const MEASURE = String.raw`
(() => {
  const h1 = document.querySelector("h1");
  const grid = h1.closest(".grid");
  const copyCol = h1.parentElement;
  const panel = grid.children[1];

  const r = (el) => {
    const b = el.getBoundingClientRect();
    return { l: Math.round(b.left), r: Math.round(b.right), w: Math.round(b.width), t: Math.round(b.top), b: Math.round(b.bottom) };
  };

  const cs = getComputedStyle(h1);
  const range = document.createRange();
  range.selectNodeContents(h1);

  /* Widest single unbreakable run — the word that decides min-content width. */
  const text = h1.textContent.replace(/\s+/g, " ").trim();
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;";
  probe.style.font = cs.font;
  probe.style.letterSpacing = cs.letterSpacing;
  document.body.appendChild(probe);
  let widest = "";
  let widestPx = 0;
  for (const w of text.split(" ")) {
    probe.textContent = w;
    const wpx = probe.getBoundingClientRect().width;
    if (wpx > widestPx) { widestPx = wpx; widest = w; }
  }
  probe.remove();

  const overlapX = Math.min(r(copyCol).r, r(panel).r) - Math.max(r(copyCol).l, r(panel).l);
  const overlapY = Math.min(r(copyCol).b, r(panel).b) - Math.max(r(copyCol).t, r(panel).t);

  return JSON.stringify({
    h1FontPx: +parseFloat(cs.fontSize).toFixed(1),
    copyCol: r(copyCol),
    panel: r(panel),
    widestWord: widest,
    widestWordPx: Math.round(widestPx),
    trackRight: r(copyCol).r,
    /* how far the widest word pushes past its own column track */
    spillPastTrack: Math.round(widestPx + (r(copyCol).w - range.getBoundingClientRect().width)),
    textRightEdge: Math.round(range.getBoundingClientRect().right),
    cols: getComputedStyle(grid).gridTemplateColumns,
  });
})()
`;

console.log("width | h1 font | copy col | panel  | widest word        | text right | col right | verdict");
console.log("-".repeat(104));

/* Wait for the layout to stop moving before reading it. Sweeping widths forces
   a fresh layout at each one, and a cold route is still compiling when the
   measurement is taken — which produces rows that are confidently wrong
   (32px type in a 1904px "stacked" column) rather than obviously broken. */
const WAIT_STABLE = String.raw`
(async () => {
  const deadline = Date.now() + 20000;
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

for (const width of WIDTHS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await send("Page.navigate", { url: BASE });

  const ready = await send("Runtime.evaluate", {
    expression: WAIT_STABLE,
    returnByValue: true,
    awaitPromise: true,
  });
  if (ready.result?.value !== "stable") {
    console.log(`${String(width).padEnd(6)} | page never settled (${ready.result?.value}) — row skipped`);
    continue;
  }

  const res = await send("Runtime.evaluate", { expression: MEASURE, returnByValue: true });
  if (!res.result?.value) {
    console.log(`${width} | probe failed`);
    continue;
  }
  const m = JSON.parse(res.result.value);
  const collides = m.textRightEdge > m.copyCol.r;
  const stack = m.copyCol.l === m.panel.l ? "(stacked)" : "";
  console.log(
    [
      String(width).padEnd(6),
      `${m.h1FontPx}px`.padEnd(8),
      `${m.copyCol.w}`.padEnd(8),
      `${m.panel.w}`.padEnd(6),
      `${m.widestWord} ${m.widestWordPx}px`.padEnd(21),
      String(m.textRightEdge).padEnd(10),
      String(m.copyCol.r).padEnd(10),
      collides ? `OVERLAP by ${m.textRightEdge - m.copyCol.r}px` : `ok ${stack}`,
    ].join(" | "),
  );
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
