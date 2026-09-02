const DEFAULT_BB_SERVER_PORT = 38886;
export const DEFAULT_BB_SERVER_URL = `http://127.0.0.1:${DEFAULT_BB_SERVER_PORT}`;
const DEFAULT_WINDOW_HEIGHT = 900;
const DEFAULT_WINDOW_WIDTH = 1280;
export const MIN_WINDOW_HEIGHT = 600;
export const MIN_WINDOW_WIDTH = 500;
export const STARTUP_POLL_INTERVAL_MS = 250;
export const STARTUP_TIMEOUT_MS = 60_000;
export const ATTACH_PROBE_TIMEOUT_MS = 1_500;
// Budget for the existence check that decides whether to attach to an
// already-running bb or spawn an owned one. A single ATTACH_PROBE_TIMEOUT_MS
// attempt can land during a stall on an otherwise-healthy server and read back
// "unavailable", which then spawns a redundant owned server that immediately
// collides on the same port.
//
// Sized to match this repo's own precedent for waiting on a bb that is busy or
// coming up — sync-live.mjs's waitForServerUp polls for 60s and treats a failed
// health check as "not up yet" rather than an error. An earlier 3s value here
// was calibrated for a brief hiccup and proved far too small: a loaded daily
// driver was measured answering /health in 4s and the config endpoint in 9s,
// while thread-timeline builds blocked its event loop.
//
// A budget this long is only affordable because the probe now distinguishes
// "nothing is listening" from "listening but slow" (UnavailableServerProbeResult's
// timedOut). Callers deciding attach-vs-spawn pass stopWhenNothingListening, so
// an absent server still costs milliseconds — only a server that is actually
// there gets waited on.
export const EXISTENCE_PROBE_TIMEOUT_MS = 60_000;
export const PROCESS_LOG_LINE_LIMIT = 200;

export type RuntimeOwnership = "attached" | "spawned";
export type WindowStateKey = string;

export const PRIMARY_WINDOW_STATE_KEY = "main";

export interface WindowBounds {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface PersistedWindowState {
  bounds: WindowBounds;
  isFullScreen: boolean;
  isMaximized: boolean;
}

export interface PersistedWindowStateEntry extends PersistedWindowState {
  stateKey: WindowStateKey;
}

export interface PersistedWindowStateFile {
  windows: PersistedWindowStateEntry[];
}

export interface DisplayWorkArea {
  height: number;
  width: number;
  x: number;
  y: number;
}

export const DEFAULT_WINDOW_STATE: PersistedWindowState = {
  bounds: {
    height: DEFAULT_WINDOW_HEIGHT,
    width: DEFAULT_WINDOW_WIDTH,
    x: 80,
    y: 80,
  },
  isFullScreen: false,
  isMaximized: false,
};
