import { useEffect, useRef, type ReactNode } from "react";
import { MarkdownPreview } from "./markdown-preview";
import { MARKDOWN_CODE_ACTIONS_ATTRIBUTE } from "./markdown-code-card";
import { StoryCard, StoryRow } from "../../../.ladle/story-card";

export default {
  title: "ui/Markdown Code Card",
};

function Stage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[680px] text-sm leading-relaxed text-foreground">
      {children}
    </div>
  );
}

/**
 * Draws the Play button the runbutton plugin injects, the same way the plugin
 * does: find the card's action group by its attribute, prepend a button
 * carrying the plugin's own classes. Ladle has no plugin host, so without this
 * the run shape could not be seen at all — and rendering it through the real
 * seam is what makes the story evidence rather than a mock-up.
 */
function WithInjectedRunButton({ children }: { children: ReactNode }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (host === null) return;
    const injected: HTMLElement[] = [];
    for (const group of Array.from(
      host.querySelectorAll<HTMLElement>(`[${MARKDOWN_CODE_ACTIONS_ATTRIBUTE}]`),
    )) {
      const button = document.createElement("button");
      button.type = "button";
      button.title = "Run and show the output here";
      button.setAttribute("aria-label", "Run and show the output here");
      button.className =
        "inline-flex size-5 cursor-pointer items-center justify-center rounded text-foreground/85 transition-colors hover:bg-foreground/[0.08] hover:text-foreground";
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "2");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("class", "size-3.5");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute("d", "M8 5.1v13.8L19.5 12 8 5.1Z");
      svg.append(path);
      button.append(svg);
      group.prepend(button);
      injected.push(button);
    }
    return () => {
      for (const button of injected) button.remove();
    };
  });
  return <div ref={hostRef}>{children}</div>;
}

const RUNNABLE = [
  "Roll it all back with one command if something goes wrong:",
  "",
  "```bash",
  "cp ~/.claude.json.bak-20260904-020127 ~/.claude.json",
  "```",
].join("\n");

const PLAIN = [
  "The handle it registered under:",
  "",
  "```",
  "backspace-oddity-brain",
  "```",
].join("\n");

const MULTILINE = [
  "```bash",
  "cd ~/bb-experiments/bb-source",
  "pnpm install",
  "pnpm exec vitest run --project @bb/app",
  "```",
].join("\n");

export function CodeCard() {
  return (
    <StoryCard labelWidth="220px">
      <StoryRow
        label="Runnable command"
        hint="One line of shell: code and actions share a row. Run comes from the runbutton plugin, Copy from the card itself."
      >
        <Stage>
          <WithInjectedRunButton>
            <MarkdownPreview content={RUNNABLE} />
          </WithInjectedRunButton>
        </Stage>
      </StoryRow>

      <StoryRow
        label="Plain string"
        hint="Same card, nothing to run: Copy is the only action. A fence with no language still gets a card rather than falling back to inline code."
      >
        <Stage>
          <MarkdownPreview content={PLAIN} />
        </Stage>
      </StoryRow>

      <StoryRow
        label="Several lines"
        hint="Too tall for one row, so the actions take their own strip and line wrapping becomes available."
      >
        <Stage>
          <WithInjectedRunButton>
            <MarkdownPreview content={MULTILINE} />
          </WithInjectedRunButton>
        </Stage>
      </StoryRow>
    </StoryCard>
  );
}
