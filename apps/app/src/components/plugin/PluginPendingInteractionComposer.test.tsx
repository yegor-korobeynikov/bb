// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PluginPendingInteraction } from "@bb/domain";
import { BbHttpError } from "@bb/sdk/browser";
import type { PluginPendingInteractionProps } from "@get-bb/plugin-sdk";

const respond = vi.fn();
const cancelInteraction = vi.fn();
vi.mock("@/lib/sdk", () => ({
  sdk: {
    threads: {
      interactions: {
        respond: (args: unknown) => respond(args),
        cancel: (args: unknown) => cancelInteraction(args),
      },
    },
  },
}));
import {
  resetPluginSlotStoreForTest,
  setPluginSlotRegistrations,
  type PluginRegistrationSet,
} from "@/lib/plugin-slots";
import { resetAllCrashedPluginSlotsForTest } from "./PluginSlotMount";
import { PluginPendingInteractionComposer } from "./PluginPendingInteractionComposer";

function registrations(
  pendingInteractions: NonNullable<
    PluginRegistrationSet["pendingInteractions"]
  >,
): PluginRegistrationSet {
  return {
    homepageSections: [],
    settingsSections: [],
    navPanels: [],
    threadPanelActions: [],
    pendingInteractions,
    sidebarFooterActions: [],
    fileOpeners: [],
    messageDirectives: [],
  };
}

const interaction: PluginPendingInteraction = {
  id: "pint_23456789ab",
  threadId: "thr_test",
  turnId: null,
  origin: { kind: "plugin", pluginId: "secrets", rendererId: "secret-request" },
  status: "pending",
  payload: {
    kind: "plugin",
    title: "Add secrets",
    data: { fields: ["API_KEY"] },
  },
  resolution: null,
  statusReason: null,
  createdAt: 1,
  expiresAt: 2,
  resolvedAt: null,
};

afterEach(() => {
  cleanup();
  respond.mockReset();
  cancelInteraction.mockReset();
  resetPluginSlotStoreForTest();
  // A crashed slot instance is remembered for the lifetime of the module, so
  // without this a renderer that throws in one test disables that same
  // plugin/slot pair for every test that runs after it.
  resetAllCrashedPluginSlotsForTest();
  // restore, not clear: `vi.clearAllMocks` only drops recorded calls, leaving
  // the `console` spies below installed and silencing later tests.
  vi.restoreAllMocks();
});

describe("PluginPendingInteractionComposer", () => {
  it("mounts only the renderer registered by the interaction's plugin", () => {
    function WrongRenderer() {
      return <div>wrong plugin renderer</div>;
    }
    function MatchingRenderer({
      interaction: view,
    }: PluginPendingInteractionProps) {
      return <div>form {view.title}</div>;
    }
    setPluginSlotRegistrations(
      "wrong-plugin",
      registrations([{ id: "secret-request", component: WrongRenderer }]),
    );
    setPluginSlotRegistrations(
      "secrets",
      registrations([{ id: "secret-request", component: MatchingRenderer }]),
    );

    render(<PluginPendingInteractionComposer interaction={interaction} />);

    expect(screen.getByText("form Add secrets")).toBeDefined();
    expect(screen.queryByText("wrong plugin renderer")).toBeNull();
  });

  it("keeps a host-owned cancel fallback when the renderer is missing", () => {
    render(<PluginPendingInteractionComposer interaction={interaction} />);
    expect(screen.getByText(/form is unavailable/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  // Both cases below reproduce the same live defect from two directions: a
  // "Move to Track" dialog whose interaction had already been interrupted
  // server-side (pint_9kzaem4z34, reason "server-restarted") stayed on screen
  // as a live form and answered the click with the transport's own string.
  it("answers a buried question with a sentence, not the transport's status line", async () => {
    respond.mockRejectedValueOnce(
      new BbHttpError({
        body: null,
        code: "invalid_request",
        message: "Pending interaction pint_23456789ab is already interrupted",
        status: 409,
      }),
    );
    function Picker({ submit }: PluginPendingInteractionProps) {
      return (
        <button
          type="button"
          // The host rethrows so a plugin form can react too; swallow it here
          // the way a form with its own error handling would.
          onClick={() => void submit({ choice: "new" }).catch(() => {})}
        >
          Move
        </button>
      );
    }
    setPluginSlotRegistrations(
      "secrets",
      registrations([{ id: "secret-request", component: Picker }]),
    );

    render(<PluginPendingInteractionComposer interaction={interaction} />);
    fireEvent.click(screen.getByRole("button", { name: "Move" }));

    const card = await waitFor(() => {
      const node = document.querySelector("[data-plugin-interaction-card]");
      expect(node?.getAttribute("data-plugin-interaction-dead")).toBe("1");
      return node as HTMLElement;
    });
    // The dead question is no longer answerable, and nothing on the card
    // spells a status code or an interaction id.
    expect(screen.queryByRole("button", { name: "Move" })).toBeNull();
    expect(card.textContent).not.toMatch(/HTTP\s+\d{3}|pint_[a-z0-9]{6,}/i);
    expect(card.textContent).not.toMatch(/already interrupted/i);
    expect(screen.getByText(/stopped waiting for an answer/i)).toBeDefined();
    // ...and there is a way out plus the named way to repeat the move.
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeDefined();
    expect(screen.getByText(/Run “Add secrets” again/)).toBeDefined();
  });

  it("stops showing a question whose deadline passed, with no server event", async () => {
    function Picker() {
      return <div>live form</div>;
    }
    setPluginSlotRegistrations(
      "secrets",
      registrations([{ id: "secret-request", component: Picker }]),
    );

    render(
      <PluginPendingInteractionComposer
        interaction={{ ...interaction, expiresAt: Date.now() - 1 }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("live form")).toBeNull();
    });
    expect(
      document
        .querySelector("[data-plugin-interaction-card]")
        ?.getAttribute("data-plugin-interaction-dead"),
    ).toBe("1");
  });

  it("keeps cancel available when the renderer crashes", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    function Crashed(): never {
      throw new Error("boom");
    }
    setPluginSlotRegistrations(
      "secrets",
      registrations([{ id: "secret-request", component: Crashed }]),
    );
    render(<PluginPendingInteractionComposer interaction={interaction} />);
    expect(screen.getByText(/form crashed/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });
});
