// @vitest-environment jsdom
//
// Contract for the design gallery's palette (written before the implementation,
// per the contract-before-code rule in tendo-design-system/SHAPE.md A3).
//
// What must be true: the Ladle gallery renders the SAME palette the running app
// renders. The app gets its palette as the trailing <style id="bb-app-theme">
// in <head>, injected from the active theme's CSS; Ladle has no server-driven
// appearance, so it applies the same CSS through the same code path. Anything
// else — a copied palette file, a Ladle-only stylesheet — reintroduces exactly
// the two-sources-that-disagree failure that decision-tendo-design-system-
// deferred-for-feature-velocity-v1 consolidated away.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applyGalleryTheme } from "./gallery-theme";

const INK_PAPER_SAMPLE = `:root { --canvas: #EDE5D3; }\n.dark { --canvas: #0A1418; }\n`;

describe("gallery theme", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.head.innerHTML = "";
    localStorage.clear();
  });

  it("injects the active theme CSS into the app's own palette element", () => {
    applyGalleryTheme(INK_PAPER_SAMPLE);

    const style = document.getElementById("bb-app-theme");
    expect(style).toBeInstanceOf(HTMLStyleElement);
    expect(style?.textContent).toBe(INK_PAPER_SAMPLE);
  });

  it("keeps the palette last in <head> so it wins by source order", () => {
    applyGalleryTheme(INK_PAPER_SAMPLE);

    // Vite's dev server appends <style data-vite-dev-id> tags after mount; the
    // palette has to be re-seated or the base theme.css tokens win instead.
    const late = document.createElement("style");
    late.setAttribute("data-vite-dev-id", "late");
    document.head.appendChild(late);

    applyGalleryTheme(INK_PAPER_SAMPLE);

    expect(document.head.lastElementChild?.id).toBe("bb-app-theme");
  });

  it("applies no override when no custom theme is active", () => {
    applyGalleryTheme("");

    // The app's injector always owns the element; "default palette" means it
    // carries nothing, so base theme.css tokens show through untouched.
    expect(document.getElementById("bb-app-theme")?.textContent ?? "").toBe("");
    expect(localStorage.getItem("bb.appThemeCss")).toBeNull();
  });
});
