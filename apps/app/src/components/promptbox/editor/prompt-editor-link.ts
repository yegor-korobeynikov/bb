import { find } from "linkifyjs";

/**
 * The href to link a text selection to when the clipboard's plain text is
 * pasted over it, or null when the paste should fall through to normal text
 * insertion. Mirrors @tiptap/extension-link's own paste-over-selection check
 * (its pasteHandler plugin never runs here — the composer's editorProps.
 * handlePaste in PromptBoxInternal.tsx always claims text pastes first, so
 * that plugin's `handlePaste` prop is never reached) — the whole pasted
 * string must resolve to exactly one link, not merely contain one, or
 * pasting "check example.com now" over a selection would wrongly link it.
 */
export function promptEditorPasteLinkHref(plainText: string): string | null {
  if (plainText.length === 0) {
    return null;
  }
  const link = find(plainText, { defaultProtocol: "https" }).find(
    (item) => item.isLink && item.value === plainText,
  );
  return link?.href ?? null;
}
