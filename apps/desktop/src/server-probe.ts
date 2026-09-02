import { z } from "zod";

const healthResponseSchema = z
  .object({
    ok: z.boolean(),
  })
  .passthrough();

const systemConfigResponseSchema = z
  .object({
    // Optional on purpose: the probed server can be an older bb that predates
    // this field, and it is still compatible enough to attach to.
    dataDir: z.string().min(1).optional(),
    hostDaemonPort: z.number().int().min(1).max(65_535),
    voiceTranscriptionEnabled: z.boolean(),
  })
  .passthrough();

export type ServerProbeResult =
  | CompatibleServerProbeResult
  | IncompatibleServerProbeResult
  | UnavailableServerProbeResult;

export type ServerProbeFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export interface CompatibleServerProbeResult {
  /** Data directory the probed server reports, or null on an older bb. */
  dataDir: string | null;
  kind: "compatible";
  serverUrl: string;
}

interface IncompatibleServerProbeResult {
  kind: "incompatible";
  reason: string;
  serverUrl: string;
}

interface UnavailableServerProbeResult {
  kind: "unavailable";
  reason: string;
  serverUrl: string;
  /**
   * True when this probe's own timeout fired — something accepted the
   * connection but did not answer in time, so a server may well be there and
   * merely slow. False when the connection itself failed (nothing listening).
   *
   * The two need opposite waiting strategies, and collapsing them into one
   * "unavailable" is why a single retry budget cannot serve both callers.
   */
  timedOut: boolean;
}

interface ProbeBbServerArgs {
  fetchImpl?: ServerProbeFetch;
  serverUrl: string;
  timeoutMs: number;
}

interface WaitForCompatibleServerArgs {
  intervalMs: number;
  serverUrl: string;
  timeoutMs: number;
  /**
   * Return as soon as a probe finds nothing listening at all, instead of
   * polling until the deadline.
   *
   * A caller waiting for a server it just spawned must NOT set this — that
   * server refuses connections for its first moments by definition. A caller
   * asking "is one already running?" must set it, so an absent server costs
   * milliseconds rather than the whole budget, which is what makes a long
   * budget affordable for the case that needs it: a server that is present
   * but answering slowly.
   */
  stopWhenNothingListening?: boolean;
}

interface FetchJsonArgs<TValue> {
  fetchImpl: ServerProbeFetch;
  schema: z.ZodType<TValue>;
  timeoutMs: number;
  url: string;
}

type FetchJsonResult<TValue> =
  | FetchJsonHttpErrorResult
  | FetchJsonNetworkErrorResult
  | FetchJsonSchemaErrorResult
  | FetchJsonSuccessResult<TValue>;

type FetchJsonFailureResult =
  | FetchJsonHttpErrorResult
  | FetchJsonNetworkErrorResult
  | FetchJsonSchemaErrorResult;

interface FetchJsonSuccessResult<TValue> {
  kind: "success";
  value: TValue;
}

interface FetchJsonHttpErrorResult {
  kind: "http-error";
  status: number;
}

interface FetchJsonSchemaErrorResult {
  kind: "schema-error";
  message: string;
}

interface FetchJsonNetworkErrorResult {
  /** This request's own AbortController fired, rather than the connection failing. */
  aborted: boolean;
  kind: "network-error";
  message: string;
}

interface SleepArgs {
  delayMs: number;
}

async function sleep(args: SleepArgs): Promise<void> {
  await new Promise<void>((resolvePromise) => {
    setTimeout(resolvePromise, args.delayMs);
  });
}

function endpointUrl(serverUrl: string, path: string): string {
  return new URL(path, serverUrl).toString();
}

async function fetchJson<TValue>(
  args: FetchJsonArgs<TValue>,
): Promise<FetchJsonResult<TValue>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, args.timeoutMs);

  try {
    const response = await args.fetchImpl(args.url, {
      signal: controller.signal,
    });
    if (!response.ok) {
      return {
        kind: "http-error",
        status: response.status,
      };
    }

    const parsed = args.schema.safeParse(await response.json());
    if (!parsed.success) {
      return {
        kind: "schema-error",
        message: parsed.error.message,
      };
    }

    return {
      kind: "success",
      value: parsed.data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      // The controller is ours, so its own state is the authoritative signal
      // for "we gave up on it" versus "the connection failed" — more reliable
      // than matching on the runtime's error name or message text.
      aborted: controller.signal.aborted,
      kind: "network-error",
      message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function formatFetchFailure(result: FetchJsonFailureResult): string {
  if (result.kind === "http-error") {
    return `HTTP ${result.status}`;
  }
  return result.message;
}

export async function probeBbServer(
  args: ProbeBbServerArgs,
): Promise<ServerProbeResult> {
  const fetchImpl = args.fetchImpl ?? globalThis.fetch;
  const healthResult = await fetchJson({
    fetchImpl,
    schema: healthResponseSchema,
    timeoutMs: args.timeoutMs,
    url: endpointUrl(args.serverUrl, "/health"),
  });

  if (healthResult.kind === "network-error") {
    return {
      kind: "unavailable",
      reason: healthResult.message,
      serverUrl: args.serverUrl,
      timedOut: healthResult.aborted,
    };
  }

  if (healthResult.kind !== "success") {
    return {
      kind: "incompatible",
      reason: `/health returned ${formatFetchFailure(healthResult)}`,
      serverUrl: args.serverUrl,
    };
  }

  if (!healthResult.value.ok) {
    return {
      kind: "incompatible",
      reason: "/health did not report ok=true",
      serverUrl: args.serverUrl,
    };
  }

  const configResult = await fetchJson({
    fetchImpl,
    schema: systemConfigResponseSchema,
    timeoutMs: args.timeoutMs,
    url: endpointUrl(args.serverUrl, "/api/v1/system/config"),
  });

  // A network error here (including the per-probe AbortController timeout)
  // means this single request was too slow or got cut off, not that the port
  // holds an incompatible server — /health above already confirmed a real bb
  // is responding. Report "unavailable" so waitForCompatibleServer's polling
  // loop retries within its full budget instead of giving up on one hiccup.
  if (configResult.kind === "network-error") {
    return {
      kind: "unavailable",
      reason: `/api/v1/system/config returned ${formatFetchFailure(configResult)}`,
      serverUrl: args.serverUrl,
      // /health already answered, so something is listening regardless of how
      // this request failed — never report this as "nothing is there".
      timedOut: true,
    };
  }

  if (configResult.kind !== "success") {
    return {
      kind: "incompatible",
      reason: `/api/v1/system/config returned ${formatFetchFailure(configResult)}`,
      serverUrl: args.serverUrl,
    };
  }

  return {
    dataDir: configResult.value.dataDir ?? null,
    kind: "compatible",
    serverUrl: args.serverUrl,
  };
}

/**
 * Per-attempt ceiling once a probe has actually timed out.
 *
 * The first attempt stays short so a healthy server — which answers in
 * milliseconds — costs nothing. But a loaded bb can take many seconds to
 * answer (measured: 4s on /health, 9s on the config endpoint while thread
 * timelines were blocking its event loop), and against that, repeating a
 * one-second attempt just fails identically until the budget runs out. Once
 * one attempt has timed out, something IS listening, so later attempts trade
 * latency for actually giving it time to answer.
 */
const SLOW_SERVER_PROBE_TIMEOUT_MS = 10_000;

export async function waitForCompatibleServer(
  args: WaitForCompatibleServerArgs,
): Promise<ServerProbeResult> {
  const deadline = Date.now() + args.timeoutMs;
  const firstAttemptTimeoutMs = Math.min(args.intervalMs, 1_000);
  let sawTimeout = false;
  let lastResult: ServerProbeResult = {
    kind: "unavailable",
    reason: "Probe has not started",
    serverUrl: args.serverUrl,
    timedOut: false,
  };

  while (Date.now() <= deadline) {
    lastResult = await probeBbServer({
      serverUrl: args.serverUrl,
      timeoutMs: sawTimeout
        ? SLOW_SERVER_PROBE_TIMEOUT_MS
        : firstAttemptTimeoutMs,
    });

    if (lastResult.kind === "compatible") {
      return lastResult;
    }

    if (lastResult.kind === "incompatible") {
      return lastResult;
    }

    if (lastResult.timedOut) {
      sawTimeout = true;
    } else if (args.stopWhenNothingListening === true) {
      // Nothing accepted the connection, and this caller only wanted to know
      // whether a server is already there. Answer now instead of polling an
      // address that no process holds.
      return lastResult;
    }

    await sleep({ delayMs: args.intervalMs });
  }

  return {
    kind: "unavailable",
    reason: `Timed out after ${args.timeoutMs}ms waiting for bb server. Last probe: ${lastResult.reason}`,
    serverUrl: args.serverUrl,
    timedOut: sawTimeout,
  };
}
