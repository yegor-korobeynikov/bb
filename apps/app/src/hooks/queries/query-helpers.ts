import { toRecord } from "@bb/core-ui";
import { HttpError } from "@/lib/api";
import { BbHttpError } from "@/lib/sdk";

/**
 * Staleness window for prompt-history queries. Shared by the thread- and
 * project-scoped variants so they age out their cached suggestions together.
 */
export const PROMPT_HISTORY_STALE_TIME_MS = 10_000;
// A cold desktop start can take several seconds — the host daemon and server
// finish booting well after the window, plugins load and some rebuild their
// frontend bundle on the fly, and a from-source daily-driver rebuilds via
// turbo before it even starts listening. The previous budget (2 retries at a
// flat 250ms, ~500-750ms total) was sized for a brief network hiccup, not a
// server that is still coming up: a query that raced that window failed
// permanently — `staleTime: Infinity` on the queries that hit this most
// (sidebar-bootstrap, projects, threads) means nothing retries it afterward
// except the realtime layer's own reconnect-driven refetch, which needs the
// WebSocket itself to finish connecting first. Observed stuck for tens of
// seconds waiting on exactly that.
//
// Six attempts (five retries) of capped exponential backoff hold the query
// open for a bit over 9s of accumulated delay, plus the requests themselves —
// long enough to outlast a slow cold start — while a healthy server still
// resolves the first attempt immediately, and a genuinely dead one still
// gives up in bounded time instead of retrying forever.
const TRANSIENT_READ_RETRY_COUNT = 5;
const TRANSIENT_READ_RETRY_BASE_DELAY_MS = 300;
const TRANSIENT_READ_RETRY_MAX_DELAY_MS = 5_000;

/**
 * `attemptIndex` is 0 on the first retry (react-query's `retryDelay` callback
 * convention), so the sequence is 300ms, 600ms, 1200ms, 2400ms, 4800ms —
 * summing to a bit over 9s of waiting across the five retries, plus the
 * requests themselves. The cap only bites past this budget's five retries
 * (attemptIndex 5+ would be 9600ms, held to 5000ms).
 */
export function transientReadRetryDelay(attemptIndex: number): number {
  return Math.min(
    TRANSIENT_READ_RETRY_BASE_DELAY_MS * 2 ** attemptIndex,
    TRANSIENT_READ_RETRY_MAX_DELAY_MS,
  );
}

export interface QueryOptions {
  enabled?: boolean;
}

interface RequireEnabledQueryArgArgs<T> {
  value: T | null | undefined;
  hookName: string;
  argName: string;
}

/**
 * Asserts a query argument is present once its query is enabled. Query hooks
 * gate `enabled` on their id/arg being set, so the queryFn only runs with a
 * real value — this turns that invariant into a typed non-null at the call
 * site, and throws (rather than firing a request with a missing arg) if the
 * invariant is ever violated. Treats empty string as missing so a blank id is
 * rejected the same as null/undefined; a numeric `0` is kept.
 */
export function requireEnabledQueryArg<T>({
  value,
  hookName,
  argName,
}: RequireEnabledQueryArgArgs<T>): T {
  if (value == null || value === "") {
    throw new Error(
      `${hookName}: ${argName} is required when query is enabled`,
    );
  }
  return value;
}

export function requireProjectId(
  projectId: string | undefined,
  hookName: string,
): string {
  return requireEnabledQueryArg({
    value: projectId,
    hookName,
    argName: "projectId",
  });
}

export function requireThreadId(id: string, hookName: string): string {
  return requireEnabledQueryArg({ value: id, hookName, argName: "thread id" });
}

function normalizeErrorMessage(message: string): string {
  return message.replace(/\s+/g, " ").trim().toLowerCase();
}

export function isTransientReadError(error: unknown): boolean {
  if (toRecord(error)?.name === "AbortError") {
    return true;
  }
  if (error instanceof HttpError || error instanceof BbHttpError) {
    return false;
  }

  const record = toRecord(error);
  if (!record || typeof record.message !== "string") {
    return false;
  }

  const message = normalizeErrorMessage(record.message);
  return (
    message.includes("failed to fetch") ||
    message.includes("load failed") ||
    message.includes("networkerror")
  );
}

export function shouldRetryTransientReadQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= TRANSIENT_READ_RETRY_COUNT) {
    return false;
  }

  return isTransientReadError(error);
}
