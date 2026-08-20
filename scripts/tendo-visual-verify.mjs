#!/usr/bin/env node
// Autonomous visual verification for the running Tendo desktop app.
//
// Connects to the Electron renderer via the Chrome DevTools Protocol
// (launch the app with --remote-debugging-port=9333). Unlike an OS-level
// screenshot, CDP reads straight from the renderer's compositor, so it is
// immune to the macOS multi-Space focus problem that broke plain
// osascript+screencapture earlier in this session.
//
// Two outputs per run, always together:
//   1. Numeric verdict — computed styles / getBoundingClientRect for named
//      checks, pass/fail against an expected predicate. This is the
//      programmatic half Yegor asked for — not "looks right in a screenshot."
//   2. A PNG screenshot for human sanity-check, saved next to the JSON.
//
// Usage: node scripts/tendo-visual-verify.mjs [--port 9333] [--out /tmp/tendo-verify]

import { writeFileSync } from "node:fs";
// Node 22 ships a native global WebSocket — no dependency needed.

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const outArg = args.indexOf("--out");
const port = portArg !== -1 ? Number(args[portArg + 1]) : 9333;
const outBase = outArg !== -1 ? args[outArg + 1] : "/tmp/tendo-verify";

// Named checks: each is a pure DOM predicate run in the page context via
// Runtime.evaluate. Add new checks here as new UI fixes need verification —
// this file is the reusable instrument, not a one-off probe.
const CHECKS = {
  sidebarChevronVisible: `
    (() => {
      const rows = Array.from(document.querySelectorAll('[data-sidebar-child-toggle]'));
      if (rows.length === 0) return { found: false };
      const el = rows[0];
      const cs = getComputedStyle(el);
      return {
        found: true,
        count: rows.length,
        display: cs.display,
        opacity: cs.opacity,
        visible: cs.display !== 'none' && Number(cs.opacity) > 0,
      };
    })()
  `,
  sidebarTreeConnectorLine: `
    (() => {
      const spans = Array.from(document.querySelectorAll('span.pointer-events-none.absolute'))
        .filter(el => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return r.width <= 2 && r.height > 20;
        });
      return {
        found: spans.length > 0,
        count: spans.length,
        samples: spans.slice(0, 3).map(el => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return { width: r.width, height: r.height, left: r.left, top: r.top, bg: cs.backgroundColor, opacity: cs.opacity };
        }),
      };
    })()
  `,
  sidebarUnreadDotColor: `
    (() => {
      const dots = Array.from(document.querySelectorAll('[data-testid*="status" i], [class*="status-dot" i]'));
      return {
        found: dots.length > 0,
        count: dots.length,
        samples: dots.slice(0, 5).map(el => ({ bg: getComputedStyle(el).backgroundColor })),
      };
    })()
  `,
};

function send(ws, id, method, params = {}) {
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data.toString());
      if (msg.id === id) {
        ws.removeEventListener("message", handler);
        if (msg.error) reject(new Error(JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function main() {
  const listRes = await fetch(`http://localhost:${port}/json/list`);
  const targets = await listRes.json();
  const page = targets.find((t) => t.type === "page" && t.url.includes("38886"));
  if (!page) {
    console.error("No matching Tendo page target found on debug port", port);
    console.error(targets.map((t) => `${t.type} ${t.url}`).join("\n"));
    process.exit(1);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  let id = 1;
  await send(ws, id++, "Page.enable");
  await send(ws, id++, "Runtime.enable");

  const verdict = { timestamp: new Date().toISOString(), checks: {} };
  for (const [name, expr] of Object.entries(CHECKS)) {
    const result = await send(ws, id++, "Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
    });
    verdict.checks[name] = result.result.value ?? { error: result.exceptionDetails ?? "unknown" };
  }

  const shot = await send(ws, id++, "Page.captureScreenshot", { format: "png" });
  const pngPath = `${outBase}.png`;
  writeFileSync(pngPath, Buffer.from(shot.data, "base64"));
  verdict.screenshot = pngPath;

  const jsonPath = `${outBase}.json`;
  writeFileSync(jsonPath, JSON.stringify(verdict, null, 2));

  console.log(JSON.stringify(verdict, null, 2));
  console.log(`\nScreenshot: ${pngPath}`);
  console.log(`Verdict JSON: ${jsonPath}`);

  ws.close();
  return verdict;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
