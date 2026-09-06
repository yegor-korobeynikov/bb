// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MarkdownPreview } from "./markdown-preview";
import { MARKDOWN_CODE_ACTIONS_ATTRIBUTE } from "./markdown-code-card";

afterEach(() => {
  cleanup();
});

function renderMarkdown(markdown: string): HTMLElement {
  const { container } = render(<MarkdownPreview content={markdown} />);
  return container;
}

function card(container: HTMLElement): HTMLElement {
  const pre = container.querySelector("pre.bb-code-highlight");
  const found = pre?.parentElement;
  if (!(found instanceof HTMLElement)) {
    throw new Error("no code card rendered");
  }
  return found;
}

describe("markdown code card", () => {
  it("puts a one-line snippet and its actions on the same row", () => {
    const container = renderMarkdown("```bash\nls -la\n```");
    const plate = card(container);
    const actions = plate.querySelector(
      `[${MARKDOWN_CODE_ACTIONS_ATTRIBUTE}]`,
    );

    // Same parent, in order: the code, then the actions. A header strip would
    // put the actions in a sibling of the <pre> instead.
    expect(actions?.parentElement).toBe(plate);
    expect(plate.children[0]?.tagName).toBe("PRE");
    expect(plate.children[1]).toBe(actions);
  });

  it("gives a multi-line snippet its own action strip above the code", () => {
    const container = renderMarkdown("```bash\ncd /tmp\nls -la\n```");
    const plate = card(container);
    const actions = plate.querySelector(
      `[${MARKDOWN_CODE_ACTIONS_ATTRIBUTE}]`,
    );

    expect(actions?.parentElement).not.toBe(plate);
    expect(actions?.parentElement?.parentElement).toBe(plate);
    expect(plate.querySelector("pre")?.textContent).toContain("cd /tmp");
  });

  it("offers copy in both shapes, and line wrapping only where lines can wrap", () => {
    const oneLine = renderMarkdown("```\nnpm run dev\n```");
    expect(
      screen.getAllByRole("button", { name: "Copy code" }),
    ).toHaveLength(1);
    expect(oneLine.querySelector('[aria-label="Wrap long lines"]')).toBeNull();

    cleanup();

    const manyLines = renderMarkdown("```\nnpm run dev\nnpm test\n```");
    expect(
      screen.getAllByRole("button", { name: "Copy code" }),
    ).toHaveLength(1);
    expect(
      manyLines.querySelector('[aria-label="Wrap long lines"]'),
    ).not.toBeNull();
  });

  it("keeps the language on the code element so a plugin can read it", () => {
    // The runbutton plugin decides whether a block is runnable from this
    // class, and finds where to hang its button from the actions attribute.
    // Both are contract, not incidental markup.
    const container = renderMarkdown("```bash\nls -la\n```");
    expect(container.querySelector("code.language-bash")).not.toBeNull();
    expect(
      card(container).querySelector(`[${MARKDOWN_CODE_ACTIONS_ATTRIBUTE}]`),
    ).not.toBeNull();
  });

  it("renders an unfenced multi-line snippet as a card too", () => {
    const container = renderMarkdown("    plain indented\n    second line\n");
    expect(container.querySelector("pre.bb-code-highlight")).not.toBeNull();
  });
});
