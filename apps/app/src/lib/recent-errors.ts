const MAX_RECENT_ERRORS = 20;

const recentErrors: string[] = [];

function record(message: string): void {
  recentErrors.push(message);
  if (recentErrors.length > MAX_RECENT_ERRORS) recentErrors.shift();
}

function describe(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

let installed = false;

/**
 * Captures console errors, uncaught exceptions and unhandled rejections into
 * a small ring buffer, so a build-feedback report can carry what actually
 * went wrong instead of asking the reporter to describe it from memory.
 */
export function installRecentErrorsCapture(): void {
  if (installed) return;
  installed = true;

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    record(args.map(describe).join(" "));
    originalConsoleError(...args);
  };

  window.addEventListener("error", (event) => {
    record(describe(event.error ?? event.message));
  });
  window.addEventListener("unhandledrejection", (event) => {
    record(describe(event.reason));
  });
}

/** Newest last, capped at {@link MAX_RECENT_ERRORS}. */
export function getRecentErrors(): string[] {
  return [...recentErrors];
}
