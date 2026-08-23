import { useSyncExternalStore } from "react";

/**
 * A clock the sidebar can read during render without each row owning a
 * timer.
 *
 * The status dot fades a quiet session to its hollow state after a number of
 * hours, which means the row has to re-render when nothing about the thread
 * has changed — only the time has. Reading `Date.now()` inside render would
 * compute the right answer once and then never update: a sidebar left open
 * overnight would still be showing yesterday evening's colours.
 *
 * One module-level interval serves every subscriber, and it only exists
 * while at least one component is mounted. The tick is deliberately coarse:
 * the threshold it feeds is measured in hours, so a five-minute granularity
 * is invisible to the reader and costs one re-render of the sidebar per
 * five minutes rather than one per second.
 */
const TICK_MS = 5 * 60 * 1000;

let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === null) {
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, TICK_MS);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

// Returning the cached value, never a fresh Date.now(): useSyncExternalStore
// compares snapshots by identity and would loop forever on a value that
// changes every call.
function getSnapshot(): number {
  return now;
}

export function useCoarseClock(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
