// @vitest-environment jsdom
//
// A chat message links to a file that lives outside the thread's environment.
// This is ordinary — an agent working in one environment cites a journal, a
// node or a doc kept somewhere else on disk — and clicking such a link must
// open the panel, not hand the href to the browser.
//
// The routing here is the one an assistant message actually gets (see
// ConversationMessageContent): absolute paths are trusted, relative paths
// resolve against the environment directory.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownPreview } from "./markdown-preview";
import type { MarkdownLinkRouting } from "./markdown-link-routing";

const ENVIRONMENT_DIR = "/Users/yk/.bb/personal-workspaces/env_svhm5bqrrb";
const OUTSIDE_FILE =
  "/Users/yk/Cursor/Home space/Backspace Oddity/Internal projects/Football Club OS/.project-journal/STATE.md";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderLink(href: string): {
  opened: ReturnType<typeof vi.fn>;
  link: HTMLElement;
} {
  const opened = vi.fn(() => true);
  const routing: MarkdownLinkRouting = {
    localFile: {
      absoluteLinks: { kind: "trusted-host" },
      onOpenLink: opened,
      relativeLinks: { baseDir: ENVIRONMENT_DIR },
    },
  };
  render(
    <MarkdownPreview content={`See [STATE](${href}).`} linkRouting={routing} />,
  );
  return { opened, link: screen.getByRole("link", { name: "STATE" }) };
}

function expectOpensInPanel(href: string, expectedPath: string) {
  const { opened, link } = renderLink(href);
  fireEvent.click(link);
  expect(
    opened,
    `clicking ${href} should have opened the panel`,
  ).toHaveBeenCalledTimes(1);
  expect(opened.mock.calls[0]?.[0]).toMatchObject({ path: expectedPath });
  cleanup();
}

describe("a message link to a file outside the thread's environment", () => {
  it("opens an absolute path, spaces or not", () => {
    expectOpensInPanel(OUTSIDE_FILE, OUTSIDE_FILE);
    expectOpensInPanel("/Users/yk/notes/plain.md", "/Users/yk/notes/plain.md");
  });

  it("opens a file:// URL", () => {
    expectOpensInPanel(
      `file://${OUTSIDE_FILE.split("/").map(encodeURIComponent).join("/")}`,
      OUTSIDE_FILE,
    );
  });

  it("opens a relative path that stays inside the environment", () => {
    expectOpensInPanel("docs/plan.md", `${ENVIRONMENT_DIR}/docs/plan.md`);
    expectOpensInPanel(
      "docs/Home%20space/plan.md",
      `${ENVIRONMENT_DIR}/docs/Home space/plan.md`,
    );
  });

  // The reported bug, in the exact shape it arrived: an agent whose cwd was an
  // environment directory linked three levels up into another project.
  it("opens a relative path that climbs out of the environment", () => {
    expectOpensInPanel(
      "../../../Cursor/Home%20space/Backspace%20Oddity/Internal%20projects/Football%20Club%20OS/.project-journal/STATE.md",
      OUTSIDE_FILE,
    );
  });

  it("opens a relative path that climbs out and carries no encoded spaces", () => {
    expectOpensInPanel("../../../Cursor/plain.md", "/Users/yk/Cursor/plain.md");
  });

  // Both spellings reach the panel, so the standing instruction to agents —
  // percent-encode the spaces — costs nothing and covers the one case below.
  it("opens an absolute path whose spaces are percent-encoded", () => {
    expectOpensInPanel(
      OUTSIDE_FILE.replaceAll(" ", "%20"),
      OUTSIDE_FILE,
    );
  });

  // The one spelling nothing here can rescue: a raw space ends the link
  // destination while Markdown is still being parsed, so no anchor is ever
  // built and there is nothing for routing to resolve. Percent-encoding, or
  // angle brackets around the destination, both parse.
  it("documents that a relative path with a raw space never becomes a link", () => {
    const { container } = render(
      <MarkdownPreview
        content="See [STATE](../../../Cursor/Home space/STATE.md)."
        linkRouting={{
          localFile: {
            absoluteLinks: { kind: "trusted-host" },
            onOpenLink: vi.fn(() => true),
            relativeLinks: { baseDir: ENVIRONMENT_DIR },
          },
        }}
      />,
    );
    expect(container.querySelector("a")).toBeNull();
  });

  it("still leaves a genuine web link to the browser", () => {
    const { opened, link } = renderLink("https://example.com/state.md");
    fireEvent.click(link);
    expect(opened).not.toHaveBeenCalled();
    expect(link.getAttribute("href")).toBe("https://example.com/state.md");
  });
});
