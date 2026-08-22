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
// Relative-comparison contract (Yegor, 2026-08-21 — the sidebar is a
// virtualized list; bb only mounts rows scrolled into the current viewport,
// so `document.querySelectorAll(...)` on any per-row marker only ever sees
// whatever subset happens to be mounted at the instant the check runs. A
// bare `found: false` conflated two different situations: "this row IS
// mounted and is missing the element" (a real bug) vs "no eligible row is
// mounted right now" (nothing to test, not a failure) — the sidebarNewTrack-
// HoverAction check hit exactly this, flip-flopping found=false/count=5 with
// zero code changes between runs, purely from scroll position. Every check
// below now reports `mountedRows` (the honest denominator — how many
// thread-rows exist in the DOM right now) alongside its own count, and an
// `inconclusive` flag when mountedRows is 0 — nothing was rendered to test,
// so neither pass nor fail. This does NOT require simulating a scroll
// (deliberately out of scope this session, same principle as not simulating
// clicks/hover) — it just stops mis-reading "nothing mounted" as "broken".
const CHECKS = {
  // The indent contract (freeze rule, 2026-08-22): a thread row's title x
  // is a function of its DEPTH and nothing else. Two things used to break
  // it: (a) the expand chevron was rendered only for rows with children and
  // sat in the flex flow with its own margin, so a childless row's dot and
  // title slid left by the whole chevron slot; (b) therefore children of a
  // chevron-bearing parent and children of a childless parent landed at
  // different x. This check groups rows by depth (data attribute when the
  // build has it, computed padding-left as a fallback so it can baseline an
  // older build) and asserts every row in a depth group shares the same
  // title left edge within 1px — with and without a chevron.
  sidebarIndentDepthOnly: `
    (() => {
      // [data-sidebar-thread-id] is the invisible full-row <a> overlay
      // (absolute inset-0, empty); the visible content and the padding-left
      // live on its PARENT, the .group/thread-row container. Measure there.
      const anchors = Array.from(document.querySelectorAll('[data-sidebar-thread-id]'));
      if (anchors.length === 0) return { found: false, inconclusive: true, count: 0 };
      const groups = {};
      for (const a of anchors) {
        const row = a.closest('[class*="thread-row"]') || a.parentElement;
        if (!row) continue;
        const title = row.querySelector('span.truncate, [class*="truncate"]');
        const dot = row.querySelector('[data-sidebar-thread-status-dot]');
        const ref = title || dot;
        if (!ref) continue;
        const depthAttr = a.getAttribute('data-sidebar-thread-depth');
        const depth = depthAttr !== null ? depthAttr : 'pad:' + getComputedStyle(row).paddingLeft;
        // Viewport-absolute, NOT row-relative: the children wrapper around a
        // depth carries its own padding (bb's pl-8, and for a while a plugin
        // override halving it), which moves the ROW itself. Row-relative x
        // is blind to that — it would pass while the tree visibly staggers.
        // Absolute x is what the eye compares, so it is what this asserts.
        const x = Math.round(ref.getBoundingClientRect().left * 10) / 10;
        const hasChevron = row.querySelector('[data-sidebar-child-toggle]') !== null;
        (groups[depth] ||= []).push({ x, hasChevron, title: (ref.textContent || '').trim().slice(0, 28) });
      }
      const report = {};
      let pass = true;
      for (const [depth, items] of Object.entries(groups)) {
        const xs = items.map(i => i.x);
        const min = Math.min(...xs), max = Math.max(...xs);
        const spread = Math.round((max - min) * 10) / 10;
        const withChevron = items.filter(i => i.hasChevron).map(i => i.x);
        const without = items.filter(i => !i.hasChevron).map(i => i.x);
        const chevronDelta = withChevron.length && without.length
          ? Math.round((Math.min(...withChevron) - Math.max(...without)) * 10) / 10 : null;
        if (spread > 1) pass = false;
        report[depth] = { count: items.length, min, max, spread, chevronDelta, samples: items.slice(0, 4) };
      }
      const grouped = Object.keys(report).length;
      // No anchor resolved in any row = the selector is wrong for this build,
      // not a clean sidebar — never let that read as a pass.
      if (grouped === 0) return { found: true, count: anchors.length, pass: false, inconclusive: true, groups: report };
      // Visible step between consecutive numeric depths (absolute x of the
      // group's min). Informational, not asserted: whether the step is the
      // right SIZE is a token-tuning question; whether it is CONSISTENT
      // across depths is what the spread assertion above already covers.
      const numericDepths = Object.keys(report).filter(d => /^\\d+$/.test(d)).map(Number).sort((a, b) => a - b);
      const steps = {};
      for (let i = 1; i < numericDepths.length; i++) {
        const a = numericDepths[i - 1], b = numericDepths[i];
        steps[a + '->' + b] = Math.round((report[String(b)].min - report[String(a)].min) * 10) / 10;
      }
      return { found: true, count: anchors.length, pass, steps, groups: report };
    })()
  `,
  sidebarChevronVisible: `
    (() => {
      const mountedRows = document.querySelectorAll('[class*="thread-row"]').length;
      const rows = Array.from(document.querySelectorAll('[data-sidebar-child-toggle]'));
      // No independent DOM signal for "this mounted row SHOULD have a
      // chevron" exists without the plugin's own parentThreadId data (only
      // rows with children get one, and "has children" isn't otherwise
      // exposed in the DOM) — so this stays a coarse count against
      // mountedRows, not a strict per-row assertion like the status-dot
      // checks below.
      if (rows.length === 0) return { found: false, count: 0, mountedRows, inconclusive: mountedRows === 0 };
      const el = rows[0];
      const cs = getComputedStyle(el);
      return {
        found: true,
        count: rows.length,
        mountedRows,
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
      const mountedRows = document.querySelectorAll('[class*="thread-row"]').length;
      const dots = Array.from(document.querySelectorAll('[data-sidebar-thread-status-dot]'));
      // Unlike the chevron, SidebarThreadStatusDot.tsx's own doc comment is
      // explicit: "Leading status marker on every sidebar thread row" — no
      // exceptions, session or track. That makes this a real strict
      // assertion, not just a coarse count: every mounted row should have
      // exactly one.
      const allRowsHaveDot = mountedRows > 0 && dots.length === mountedRows;
      if (dots.length === 0) return { found: false, count: 0, mountedRows, inconclusive: mountedRows === 0, allRowsHaveDot: false, samples: [] };
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
      return { found: true, count: dots.length, mountedRows, allRowsHaveDot, byState, samples };
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
      const mountedRows = document.querySelectorAll('[class*="thread-row"]').length;
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
        mountedRows,
        inconclusive: mountedRows === 0,
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
      // implementation, not after): a SESSION row (no parentThreadId) with
      // NO existing track must carry a hover-revealed 'New track' action,
      // [data-bso-new-track-action], calling the same openTrack path as
      // TrackTab's native button — never a separate picker screen.
      //
      // Extended 2026-08-21 to sessions WITH a track, then RETIRED same day
      // after live measurement (Yegor, 2026-08-22): prepending a third
      // button into archive+menu's shared right-side container grows that
      // container without SIDEBAR_HOVER_ACTIONS_INSET_CLASS — the title
      // span's own reserved space, sized natively for exactly two buttons —
      // growing to match, so the button overlapped live title text
      // (measured 2.9px-22.7px overlap, worse on longer titles). This
      // contract now asserts the OPPOSITE of the 2026-08-21 version: zero
      // action buttons inside any archive/menu container, and zero overlap
      // between the (left-slot-only) action and its own row's title.
      const rectsOverlap = (a, b) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const mountedRows = document.querySelectorAll('[class*="thread-row"]').length;
      const actions = Array.from(document.querySelectorAll('[data-bso-new-track-action]'));
      const nativeButtons = Array.from(document.querySelectorAll('button')).filter((b) => {
        const label = (b.getAttribute('aria-label') || '').toLowerCase();
        return label.includes('archiv') || label.includes('actions') || label.includes('more') || label.includes('menu');
      });
      const rightSlotLeaks = actions.filter((el) =>
        nativeButtons.some((nb) => el.parentElement === nb.parentElement),
      );
      const titleOverlaps = [];
      const samples = actions.map((el) => {
        const row = el.closest('[class*="thread-row"]');
        const cs = getComputedStyle(el);
        const title = row ? row.querySelector('span.truncate, [class*="truncate"]') : null;
        if (title) {
          const ar = el.getBoundingClientRect();
          const tr = title.getBoundingClientRect();
          if (rectsOverlap(ar, tr)) {
            titleOverlaps.push({
              rowText: (row.textContent || '').trim().slice(0, 40),
              actionRect: { left: ar.left, right: ar.right },
              titleRect: { left: tr.left, right: tr.right },
            });
          }
        }
        return {
          rowText: row ? (row.textContent || '').trim().slice(0, 40) : null,
          display: cs.display,
          width: cs.width,
          position: cs.position,
          left: cs.left,
          zIndex: cs.zIndex,
          ariaLabel: el.getAttribute('aria-label'),
        };
      });
      // Every mounted action must render identically — one code path, one
      // shape (Yegor, 2026-08-22: measured two different renders, 20x20
      // static and 14x14 absolute z2, live evidence of two divergent code
      // paths after the right-slot variant was removed there should only
      // ever be one).
      const shapes = new Set(samples.map((s) => \`\${s.width}|\${s.position}|\${s.left}|\${s.zIndex}\`));
      // Eligible-rendered proxy, CDP-only (no access to the plugin's own
      // parentThreadId data): a row without [data-sidebar-child-toggle] is
      // a session with no track yet — the only eligible case now.
      return {
        found: actions.length > 0,
        count: actions.length,
        mountedRows,
        inconclusive: mountedRows === 0,
        rightSlotLeakCount: rightSlotLeaks.length,
        rightSlotPass: rightSlotLeaks.length === 0,
        titleOverlapCount: titleOverlaps.length,
        titleOverlapPass: titleOverlaps.length === 0,
        titleOverlaps: titleOverlaps.slice(0, 10),
        distinctShapeCount: shapes.size,
        onePathPass: shapes.size <= 1,
        samples: samples.slice(0, 15),
      };
    })()
  `,
  archiveMenuOverlap: `
    (() => {
      // Contract (coordinator, 2026-08-21, freeze rule — written before the
      // fix): "Archive thread" and "Thread/Worktree/Second Brain actions"
      // are two DIFFERENT native bb buttons that can render stacked in the
      // same row's right-side hover slot. Confirmed live on this build:
      // archive rect left=256.09/right=276.09 vs actions rect
      // left=266.09/right=286.09 on the same row (top=373.95) — a 10px
      // click-target overlap, the likely cause of the earlier accidental
      // thread-archive incident. Pass = zero rows where the two rects
      // intersect; fail = at least one row still overlapping.
      const rectsOverlap = (a, b) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const buttons = Array.from(document.querySelectorAll('button'));
      const archiveBtns = buttons.filter((b) =>
        (b.getAttribute('aria-label') || '').toLowerCase().includes('archiv'),
      );
      const menuBtns = buttons.filter((b) => {
        const label = (b.getAttribute('aria-label') || '').toLowerCase();
        return label.includes('actions') || label.includes('more') || label.includes('menu');
      });
      const overlaps = [];
      for (const a of archiveBtns) {
        const ar = a.getBoundingClientRect();
        for (const m of menuBtns) {
          const mr = m.getBoundingClientRect();
          if (rectsOverlap(ar, mr)) {
            overlaps.push({
              archiveLabel: a.getAttribute('aria-label'),
              menuLabel: m.getAttribute('aria-label'),
              archiveRect: { left: ar.left, right: ar.right, top: ar.top, bottom: ar.bottom },
              menuRect: { left: mr.left, right: mr.right, top: mr.top, bottom: mr.bottom },
            });
          }
        }
      }
      return {
        archiveCount: archiveBtns.length,
        menuCount: menuBtns.length,
        overlapCount: overlaps.length,
        pass: overlaps.length === 0,
        overlaps: overlaps.slice(0, 10),
      };
    })()
  `,
  tendoRowLabelAlignment: `
    (() => {
      // Contract (Yegor, 2026-08-22 — three rounds of "looks fixed" that
      // weren't): padding-left on the row CONTAINER being identical across
      // rows at the same depth is NOT the same claim as "the visible label
      // text starts at the same X." Every check above this one measures the
      // former; Yegor's own screen measurements are of the latter — where
      // the eye actually reads alignment. The gap between them is icon/
      // glyph width (chevron+dot vs plain bullet vs status-dot-only vs
      // section icon), which nothing upstream accounts for. This check
      // measures the visible quantity directly, per mounted row, and is the
      // one that must pass before anyone reports an indent fix as done.
      //
      // Sidebar is a flat virtualized list (see the relative-comparison
      // contract above) — depth is read from the row's own
      // --bb-sidebar-sticky-parent-level custom property when present,
      // otherwise parsed from the depth multiplier baked into its inline
      // padding-left calc() (both are written by the same source function
      // now, so either is ground truth, not a guess). "Logical parent" for
      // a child-direction check is the nearest PRECEDING mounted row one
      // depth shallower — the flattening convention this virtualizer uses.
      const rows = Array.from(document.querySelectorAll('[data-sidebar-windowed-item]'))
        .filter(el => el.offsetParent !== null);

      const parseDepth = (rowEl) => {
        const levelAttr = rowEl.style.getPropertyValue('--bb-sidebar-sticky-parent-level');
        if (levelAttr) return Number(levelAttr);
        const pl = rowEl.style.paddingLeft || '';
        const m = pl.match(/\\*\\s*(\\d+)\\)/);
        return m ? Number(m[1]) : null;
      };

      const items = rows.map((wrapper) => {
        const rowEl = wrapper.querySelector('[class*="thread-row"], [data-sidebar-sticky-tier]') || wrapper.firstElementChild;
        if (!rowEl) return null;
        const label = rowEl.querySelector('span.min-w-0.truncate, span[class*="truncate"]');
        if (!label) return null;
        const rowRect = rowEl.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        return {
          text: label.textContent.trim().slice(0, 40),
          depth: parseDepth(rowEl),
          rowLeft: Math.round(rowRect.left * 100) / 100,
          labelLeft: Math.round(labelRect.left * 100) / 100,
          visibleIndent: Math.round((labelRect.left - rowRect.left) * 100) / 100,
        };
      }).filter(Boolean);

      // Group by depth, check consistency of the VISIBLE indent (label.left
      // relative to the row's own left edge) within each depth.
      const byDepth = {};
      for (const it of items) {
        const key = it.depth === null ? 'unknown' : String(it.depth);
        (byDepth[key] = byDepth[key] || []).push(it);
      }
      const depthConsistency = Object.entries(byDepth).map(([depth, group]) => {
        const values = group.map(g => g.labelLeft);
        const min = Math.min(...values);
        const max = Math.max(...values);
        return {
          depth,
          rowCount: group.length,
          labelLeftMin: min,
          labelLeftMax: max,
          spreadPx: Math.round((max - min) * 100) / 100,
          consistent: max - min <= 2,
          samples: group.slice(0, 5),
        };
      });

      // Direction check: every child must sit strictly right of its nearest
      // shallower-depth predecessor. Flags the exact "track shifted left of
      // its session parent" complaint.
      const directionViolations = [];
      for (let i = 0; i < items.length; i++) {
        const cur = items[i];
        if (cur.depth === null || cur.depth === 0) continue;
        let parent = null;
        for (let j = i - 1; j >= 0; j--) {
          if (items[j].depth !== null && items[j].depth < cur.depth) { parent = items[j]; break; }
        }
        if (parent && cur.labelLeft <= parent.labelLeft) {
          directionViolations.push({
            child: { text: cur.text, depth: cur.depth, labelLeft: cur.labelLeft },
            parent: { text: parent.text, depth: parent.depth, labelLeft: parent.labelLeft },
          });
        }
      }

      // Wasted-left-space: how far the shallowest mounted row's label sits
      // from the sidebar's own scroll-container left edge.
      const sidebarContainer = document.querySelector('[data-sidebar="content"], [data-sidebar="menu"]');
      const containerLeft = sidebarContainer ? sidebarContainer.getBoundingClientRect().left : null;
      const shallowest = items.reduce((min, it) => (it.depth !== null && (min === null || it.depth < min.depth) ? it : min), null);

      return {
        mountedRowCount: items.length,
        depthConsistency,
        allDepthsConsistent: depthConsistency.every(d => d.consistent),
        directionViolationCount: directionViolations.length,
        directionPass: directionViolations.length === 0,
        directionViolations: directionViolations.slice(0, 10),
        containerLeft,
        shallowestRowLabelLeft: shallowest ? shallowest.labelLeft : null,
        wastedLeftSpacePx: (containerLeft !== null && shallowest) ? Math.round((shallowest.labelLeft - containerLeft) * 100) / 100 : null,
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
  // 127.0.0.1, not localhost: on macOS `localhost` resolves to ::1 first, and
  // a second headless browser can sit on [::1]:<port> while another holds
  // 127.0.0.1:<port>. That exact split produced two contradictory readings
  // of "the same page" on 2026-08-22 — one instrument on each loopback,
  // each seeing a different build. Pin the family so every tool in this
  // repo measures the same target.
  const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
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
