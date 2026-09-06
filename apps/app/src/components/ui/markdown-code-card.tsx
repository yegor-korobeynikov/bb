import { createContext, useState, type ReactNode } from "react";
import { cn } from "@bb/shared-ui/lib/utils";
import { Icon } from "@bb/shared-ui/icon";
import { CopyButton } from "./copy-button.js";

/**
 * True while rendering inside a `<pre>`, i.e. inside a fenced or indented code
 * block. Without it a one-line fence carrying no language is indistinguishable
 * from an inline code span — same text, same absent class — and would render as
 * a run of inline code, with no card and so no way to copy it.
 */
export const MarkdownFencedCodeContext = createContext(false);

/** The action group's attachment point for plugin-provided actions. */
export const MARKDOWN_CODE_ACTIONS_ATTRIBUTE = "data-bb-code-actions";

const ACTION_BUTTON_CLASS =
  "inline-flex size-5 cursor-pointer items-center justify-center rounded text-foreground/85 transition-colors hover:bg-foreground/[0.08] hover:text-foreground";

interface MarkdownCodeCardProps {
  /** The snippet, already stripped of its trailing newline. */
  codeText: string;
  /** The fence's language, or null when the fence carried none. */
  language: string | null;
  /** Syntax-highlighted HTML, or null when the snippet is rendered plain. */
  highlightedHtml: string | null;
  /** Anything react-markdown passes through to the `<code>` element. */
  codeProps: Record<string, unknown>;
}

/**
 * The card a fenced code block renders as.
 *
 * Two shapes, one component, because the two differ only in how much room the
 * code needs:
 *
 * - `row` — the whole snippet is one line, so the code and its actions share a
 *   single line. This is the shape a suggested shell command takes.
 * - `stack` — the snippet is several lines, so the actions get their own strip
 *   above the code.
 *
 * The geometry is taken from the reference block by measurement, not by eye:
 * on the reference the plate is 42px tall with a 10px radius, 20px of space
 * before the code, 16px monospace against 16px prose, and action glyphs at
 * 16px, spaced 32px centre to centre, drawn at full foreground rather than
 * muted. bb's prose runs at 14px, so every one of those numbers is carried
 * across at the 14/16 the two type scales differ by — 36px tall, 8px radius,
 * 16px of lead-in, 12px monospace, 14px glyphs 28px apart. Matching the pixel
 * values instead would have made the card bigger than the paragraph above it.
 *
 * The run action is deliberately NOT here. Running a command needs a shell,
 * which the markdown layer has no access to; the runbutton plugin owns it and
 * injects its own button into the action group. `data-bb-code-actions` is that
 * seam — it is the plugin's attachment point and part of this component's
 * contract, so it must survive any re-layout.
 */

export function MarkdownCodeCard({
  codeText,
  language,
  highlightedHtml,
  codeProps,
}: MarkdownCodeCardProps) {
  const isRow = !codeText.includes("\n");
  return isRow ? (
    <RowCard
      codeText={codeText}
      language={language}
      highlightedHtml={highlightedHtml}
      codeProps={codeProps}
    />
  ) : (
    <StackCard
      codeText={codeText}
      language={language}
      highlightedHtml={highlightedHtml}
      codeProps={codeProps}
    />
  );
}

function RowCard({
  codeText,
  language,
  highlightedHtml,
  codeProps,
}: MarkdownCodeCardProps) {
  return (
    <div className="my-2 flex h-9 items-center gap-4 overflow-hidden rounded-lg border border-border bg-surface-recessed pl-4 pr-2">
      {/* `text-xs` and a matching line box on the <pre> as well as the <code>:
          the <pre> would otherwise keep the 14px prose strut and make the row
          three pixels taller than the reference. */}
      <pre className="bb-code-highlight min-w-0 flex-1 overflow-x-auto text-xs leading-5">
        <CodeText
          codeText={codeText}
          language={language}
          highlightedHtml={highlightedHtml}
          codeProps={codeProps}
        />
      </pre>
      <ActionGroup>
        <CopyButton
          text={codeText}
          label="Copy code"
          className={ACTION_BUTTON_CLASS}
          iconClassName="size-3.5"
        />
      </ActionGroup>
    </div>
  );
}

function StackCard({
  codeText,
  language,
  highlightedHtml,
  codeProps,
}: MarkdownCodeCardProps) {
  // Long lines scroll by default; wrapping is opt-in, because a wrapped
  // command is no longer copy-pasteable by eye.
  const [softWrap, setSoftWrap] = useState(false);
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-border bg-surface-recessed">
      <div className="flex h-8 items-center justify-between pl-4 pr-2">
        <span className="font-mono text-[11px] uppercase tracking-wide text-subtle-foreground">
          {language ?? ""}
        </span>
        <ActionGroup>
          <button
            type="button"
            aria-pressed={softWrap}
            aria-label={softWrap ? "Disable line wrap" : "Wrap long lines"}
            onClick={() => {
              setSoftWrap((value) => !value);
            }}
            className={ACTION_BUTTON_CLASS}
          >
            <Icon name="TextWrap" className="size-3.5" />
          </button>
          <CopyButton
            text={codeText}
            label="Copy code"
            className={ACTION_BUTTON_CLASS}
            iconClassName="size-3.5"
          />
        </ActionGroup>
      </div>
      <pre
        className={cn(
          "bb-code-highlight px-4 pb-3",
          softWrap
            ? "whitespace-pre-wrap [overflow-wrap:anywhere]"
            : "overflow-x-auto",
        )}
      >
        <CodeText
          codeText={codeText}
          language={language}
          highlightedHtml={highlightedHtml}
          codeProps={codeProps}
        />
      </pre>
    </div>
  );
}

function ActionGroup({ children }: { children: ReactNode }) {
  return (
    <div
      {...{ [MARKDOWN_CODE_ACTIONS_ATTRIBUTE]: "" }}
      className="flex shrink-0 items-center gap-2"
    >
      {children}
    </div>
  );
}

function CodeText({
  codeText,
  language,
  highlightedHtml,
  codeProps,
}: MarkdownCodeCardProps) {
  if (highlightedHtml === null) {
    return (
      <code className="font-mono text-xs" {...codeProps}>
        {codeText}
      </code>
    );
  }
  return (
    <code
      className={cn("font-mono text-xs", language ? `language-${language}` : "")}
      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      {...codeProps}
    />
  );
}
