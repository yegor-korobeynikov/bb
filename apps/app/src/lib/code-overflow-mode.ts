import type { BaseCodeOptions } from "@pierre/diffs/react";

export type CodeOverflowMode = NonNullable<BaseCodeOptions["overflow"]>;
export type CodeOverflowModeChangeHandler = (mode: CodeOverflowMode) => void;

export const DEFAULT_CODE_OVERFLOW_MODE: CodeOverflowMode = "scroll";

// Files with these extensions render as prose (a sentence or paragraph per
// logical line) rather than source code, so a long line is a reading problem,
// not a horizontal-scan-past-the-fold tool a developer expects. Real source
// stays unwrapped by default — a wrapped diff/code file breaks horizontal
// scanning of indentation-significant content.
const PLAIN_TEXT_FILE_EXTENSIONS = [".txt", ".text", ".log"];

function hasPlainTextExtension(path: string): boolean {
  const normalizedPath = path.toLowerCase();
  return PLAIN_TEXT_FILE_EXTENSIONS.some((extension) =>
    normalizedPath.endsWith(extension),
  );
}

/**
 * The overflow mode a freshly opened file should start in. Prose-shaped
 * plain-text files default to `wrap` so every line is readable without
 * horizontal scrolling; everything else keeps the code-editor default of
 * `scroll`, which the user can still flip with the line-wrap toggle.
 */
export function getDefaultCodeOverflowMode(path: string): CodeOverflowMode {
  return hasPlainTextExtension(path) ? "wrap" : DEFAULT_CODE_OVERFLOW_MODE;
}

export function getNextCodeOverflowMode(
  mode: CodeOverflowMode,
): CodeOverflowMode {
  return mode === "wrap" ? "scroll" : "wrap";
}
