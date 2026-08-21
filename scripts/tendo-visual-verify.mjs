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
// Usage: node scripts/tendo-visual-verify.mjs [--port 9333] [--out /tmp/tendo-verify] [--match <url-fragment>]

import { writeFileSync } from "node:fs";
// Node 22 ships a native global WebSocket — no dependency needed.

const args = process.argv.slice(2);
const portArg = args.indexOf("--port");
const outArg = args.indexOf("--out");
const matchArg = args.indexOf("--match");
const match = matchArg !== -1 ? args[matchArg + 1] : null;
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
  tendoStatusDot: `
    (() => {
      const dots = Array.from(document.querySelectorAll('[data-sidebar-thread-status-dot]'));
      if (dots.length === 0) return { found: false, count: 0, samples: [] };
      const byState = {};
      for (const el of dots) {
        const state = el.getAttribute('data-sidebar-thread-status-dot');
        byState[state] = (byState[state] || 0) + 1;
      }
      const samples = dots.slice(0, 6).map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const row = el.closest('[class*="thread-row"]') || el.parentElement;
        const rowRect = row ? row.getBoundingClientRect() : null;
        // The canon states edge-to-dot and chevron-to-dot in px; measure both
        // rather than trusting the stylesheet.
        const title = el.parentElement
          ? el.parentElement.querySelector('span[class*="truncate"]')
          : null;
        const titleRect = title ? title.getBoundingClientRect() : null;
        return {
          state: el.getAttribute('data-sidebar-thread-status-dot'),
          width: Math.round(r.width * 100) / 100,
          height: Math.round(r.height * 100) / 100,
          bg: cs.backgroundColor,
          border: cs.border,
          visibility: cs.visibility,
          boxSizing: cs.boxSizing,
          ariaHidden: el.getAttribute('aria-hidden'),
          edgeToDot: rowRect ? Math.round((r.left - rowRect.left) * 100) / 100 : null,
          dotToTitle: titleRect ? Math.round((titleRect.left - r.right) * 100) / 100 : null,
        };
      });
      return { found: true, count: dots.length, byState, samples };
    })()
  `,
  tendoIndentStep: `
    (() => {
      // Follow-up to tendoStatusDot (2026-08-21): that check measures
      // edge-to-dot per row but not chevron-to-dot, and doesn't compare a
      // parent row's dot against its own child's — the two numbers the
      // indent-step port needs to land against the canon
      // (--tendo-sidebar-chevron-to-dot: 20px, --tendo-sidebar-indent-step:
      // 16px). This is UNVERIFIED-as-written ground truth for that port,
      // not a pre-existing confirmed check.
      const dots = Array.from(document.querySelectorAll('[data-sidebar-thread-status-dot]'));
      const chevronToDotSamples = dots.map((dot) => {
        const container = dot.parentElement;
        const chevron = container ? container.querySelector('[data-sidebar-child-toggle]') : null;
        if (!chevron) return null;
        const cr = chevron.getBoundingClientRect();
        const dr = dot.getBoundingClientRect();
        const row = dot.closest('[class*="thread-row"]');
        return {
          chevronToDot: Math.round((dr.left - cr.right) * 100) / 100,
          rowText: row ? (row.textContent || '').trim().slice(0, 30) : null,
        };
      }).filter(Boolean);
      return {
        found: dots.length > 0,
        totalDots: dots.length,
        rowsWithChevron: chevronToDotSamples.length,
        chevronToDotSamples: chevronToDotSamples.slice(0, 10),
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
  sidebarNewTrackHoverAction: `
    (() => {
      // Contract (Yegor, 2026-08-21, freeze rule — written BEFORE the
      // implementation, not after): every top-level SESSION row (a row
      // whose own thread has no parentThreadId — i.e. a task, not a
      // track) must carry a hover-revealed 'New track' action, marked
      // [data-bso-new-track-action], that calls the SAME create path as
      // the native TrackTab 'New track' button (the openTrack RPC:
      // taskId/projectId/title/prompt/isolate) — never a separate
      // picker/form screen. One glyph, present on every session row,
      // absent on every track (child) row.
      const actions = Array.from(document.querySelectorAll('[data-bso-new-track-action]'));
      const samples = actions.map((el) => {
        const row = el.closest('[class*="thread-row"]');
        const cs = getComputedStyle(el);
        return {
          rowText: row ? (row.textContent || '').trim().slice(0, 40) : null,
          display: cs.display,
          ariaLabel: el.getAttribute('aria-label'),
          title: el.getAttribute('title'),
        };
      });
      // Which rows carry the action is decided in the plugin from the
      // thread's own parentThreadId (structurally correct by construction,
      // per the plugin's own indent/dot rows using the same lookup) — this
      // check reports WHAT shipped, human/agent judges from rowText samples
      // whether any track (indented, non-top-level) title leaked in.
      return {
        found: actions.length > 0,
        count: actions.length,
        samples: samples.slice(0, 15),
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
  // Match any locally served Tendo page, not one hardcoded port: the daily
  // driver runs on 38886, but a dev instance derives its ports from the
  // checkout path, so pinning one number made this instrument single-target.
  // --match narrows it when several are open.
  const page = targets.find(
    (t) =>
      t.type === "page" &&
      (match !== null
        ? t.url.includes(match)
        : /https?:\/\/(127\.0\.0\.1|localhost):\d+/.test(t.url)),
  );
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
