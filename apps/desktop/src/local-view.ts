import { stripVTControlCharacters } from "node:util";
import { escapeHtmlText } from "@bb/domain";

export type LocalViewModel =
  | InfoViewModel
  | LoadingViewModel
  | StartupErrorViewModel;

interface LoadingViewModel {
  kind: "loading";
  message: string;
  title: string;
}

interface InfoViewModel {
  kind: "info";
  message: string;
  title: string;
}

export interface LocalViewAction {
  /**
   * Sent back to main via a `will-navigate` to `bb-recovery:<id>`. The error
   * view has no script (CSP forbids one), so a plain link is the only way to
   * carry a click back out of a `data:` URL.
   */
  id: string;
  label: string;
  primary?: boolean;
}

interface StartupErrorViewModel {
  actions?: LocalViewAction[];
  details: string;
  kind: "error";
  logText: string;
  title: string;
}

interface CreateLocalViewUrlArgs {
  viewModel: LocalViewModel;
}

/**
 * Fake URL scheme a recovery button link navigates to. Main intercepts the
 * navigation (`will-navigate`) before it goes anywhere and runs the matching
 * handler instead. Not a real protocol registration — just a value neither
 * `data:` nor a real page will ever produce on its own.
 */
export const RECOVERY_ACTION_URL_PREFIX = "bb-recovery:";

export function formatRecoveryActionUrl(actionId: string): string {
  return `${RECOVERY_ACTION_URL_PREFIX}${actionId}`;
}

function formatPlainLogText(value: string): string {
  return stripVTControlCharacters(value).replace(/\r\n?/gu, "\n");
}

function renderLoadingView(viewModel: LoadingViewModel): string {
  return `
    <main class="shell">
      <div class="spinner"></div>
      <h1>${escapeHtmlText(viewModel.title)}</h1>
      <p>${escapeHtmlText(viewModel.message)}</p>
    </main>
  `;
}

function renderInfoView(viewModel: InfoViewModel): string {
  return `
    <main class="shell">
      <h1>${escapeHtmlText(viewModel.title)}</h1>
      <p>${escapeHtmlText(viewModel.message)}</p>
    </main>
  `;
}

function renderRecoveryAction(action: LocalViewAction): string {
  const classAttr = action.primary ? ' class="action action-primary"' : ' class="action"';
  return `<a${classAttr} href="${formatRecoveryActionUrl(action.id)}">${escapeHtmlText(action.label)}</a>`;
}

function renderErrorView(viewModel: StartupErrorViewModel): string {
  const logText = formatPlainLogText(viewModel.logText);
  const logs =
    logText.trim().length > 0 ? `<pre>${escapeHtmlText(logText)}</pre>` : "";
  const actions =
    viewModel.actions !== undefined && viewModel.actions.length > 0
      ? `<div class="actions">${viewModel.actions.map(renderRecoveryAction).join("")}</div>`
      : "";
  return `
    <main class="shell shell-error">
      <h1>${escapeHtmlText(viewModel.title)}</h1>
      <p>${escapeHtmlText(viewModel.details)}</p>
      ${logs}
      ${actions}
    </main>
  `;
}

function renderLocalView(viewModel: LocalViewModel): string {
  let body: string;
  if (viewModel.kind === "loading") {
    body = renderLoadingView(viewModel);
  } else if (viewModel.kind === "info") {
    body = renderInfoView(viewModel);
  } else {
    body = renderErrorView(viewModel);
  }
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tendo</title>
  <style>
    :root {
      color-scheme: light dark;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      align-items: center;
      background: Canvas;
      color: CanvasText;
      display: flex;
      height: 100vh;
      justify-content: center;
      margin: 0;
    }

    .titlebar-drag-region {
      app-region: drag;
      -webkit-app-region: drag;
      background: transparent;
      border: 0;
      height: 28px;
      left: 0;
      position: fixed;
      right: 0;
      top: 0;
      user-select: none;
      z-index: 10;
    }

    button,
    a,
    input,
    textarea,
    select,
    summary,
    pre {
      app-region: no-drag;
      -webkit-app-region: no-drag;
    }

    .shell {
      max-width: 680px;
      padding: 32px;
      text-align: center;
    }

    .shell-error {
      text-align: left;
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
      letter-spacing: 0;
      line-height: 1.25;
      margin: 16px 0 8px;
    }

    p {
      color: color-mix(in srgb, CanvasText 74%, transparent);
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    pre {
      background: color-mix(in srgb, CanvasText 8%, transparent);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      line-height: 1.45;
      margin: 18px 0 0;
      max-height: 260px;
      overflow: auto;
      padding: 12px;
      white-space: pre-wrap;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-start;
      margin-top: 20px;
    }

    .action {
      background: color-mix(in srgb, CanvasText 8%, transparent);
      border: 1px solid color-mix(in srgb, CanvasText 16%, transparent);
      border-radius: 6px;
      color: CanvasText;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      padding: 8px 14px;
      text-decoration: none;
    }

    .action:hover {
      background: color-mix(in srgb, CanvasText 14%, transparent);
    }

    .action-primary {
      background: LinkText;
      border-color: LinkText;
      color: white;
    }

    .action-primary:hover {
      opacity: 0.9;
    }

    .spinner {
      animation: spin 0.9s linear infinite;
      border: 2px solid color-mix(in srgb, CanvasText 16%, transparent);
      border-top-color: CanvasText;
      border-radius: 999px;
      height: 24px;
      margin: 0 auto;
      width: 24px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
<div class="titlebar-drag-region" data-testid="bb-local-view-window-drag-region" aria-hidden="true"></div>
${body}
</body>
</html>`;
}

export function createLocalViewUrl(args: CreateLocalViewUrlArgs): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    renderLocalView(args.viewModel),
  )}`;
}
