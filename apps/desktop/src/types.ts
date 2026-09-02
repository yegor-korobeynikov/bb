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
// attempt can land during a brief stall on an otherwise-healthy server (slow
// disk, GC pause, a busy event loop) and read back "unavailable", which then
// spawns a redundant owned server that immediately collides on the same port.
// This budget is deliberately short: when nothing is listening at all (the
// common case for a first launch), every attempt fails fast, so the retry
// loop still burns through this whole window before giving up and spawning —
// it trades a few seconds of extra startup latency in that case for not
// misreading a live server's hiccup as absent.
export const EXISTENCE_PROBE_TIMEOUT_MS = 3_000;
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
