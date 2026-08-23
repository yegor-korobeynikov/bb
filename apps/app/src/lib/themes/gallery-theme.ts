import { applyAppThemeCss } from "./index";

/**
 * Apply the active bb palette inside the Ladle design gallery.
 *
 * The gallery has no server-driven appearance: Ladle mounts stories directly,
 * so nothing calls the app's normal appearance path. It applies the same CSS
 * through the same injector the app uses, so the gallery cannot show a palette
 * the app does not have. The CSS itself is resolved from the ACTIVE theme at
 * dev-server start (see .ladle/vite-active-theme.ts) — there is no second copy
 * of the palette anywhere in this repo.
 *
 * Re-seating: Vite's dev server appends `<style data-vite-dev-id>` tags to
 * <head> after mount, which would out-order the palette and silently restore
 * base theme.css tokens. Calling this again (the Provider does, on every theme
 * toggle) moves the palette element back to last.
 */
export function applyGalleryTheme(css: string): void {
  if (typeof document === "undefined") return;
  const existing = document.getElementById("bb-app-theme");
  if (existing && existing !== document.head.lastElementChild) {
    document.head.appendChild(existing);
  }
  applyAppThemeCss(css);
}
