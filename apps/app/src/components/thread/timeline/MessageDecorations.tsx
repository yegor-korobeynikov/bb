import { PluginSlotMount } from "@/components/plugin/PluginSlotMount";
import type { ThreadTimelinePluginMessageDecoration } from "./types.js";

interface MessageDecorationsProps {
  decorations: readonly ThreadTimelinePluginMessageDecoration[];
}

/**
 * Plugin-contributed inline content under one message. Renders nothing at all
 * when no plugin claims the row — the timeline reserves no space for
 * decorations, so a message without one keeps its exact previous spacing.
 *
 * Each decoration mounts through `PluginSlotMount` so a crash is contained to
 * that one plugin on that one message (`instanceId` is the message id) rather
 * than taking down the row, and the plugin's scoped stylesheet applies.
 *
 * The wrapper is `display: contents` rather than a spacing container, because
 * `decorations` counts the registrations whose role matches this row — NOT the
 * ones that decided to render something. A plugin registered for assistant
 * messages that returns null on most of them (the normal case: a comment
 * thread exists on a handful of messages, not all) would otherwise put a
 * margin box under EVERY assistant message in the conversation, which is
 * precisely the "reserves no space" promise the slot contract makes. A
 * `contents` wrapper generates no box, and PluginSlotMount's own wrapper is
 * `contents` too, so a null-returning decoration contributes literally nothing
 * to layout. The trade is that spacing belongs to the decoration: it renders
 * as a block child of the message body and brings its own top margin.
 */
export function MessageDecorations({ decorations }: MessageDecorationsProps) {
  if (decorations.length === 0) {
    return null;
  }
  return (
    <div className="contents">
      {decorations.map((decoration) => {
        const { Component, componentProps } = decoration;
        return (
          <PluginSlotMount
            key={decoration.key}
            pluginId={decoration.pluginId}
            slotKind="messageDecoration"
            slotId={decoration.slotId}
            instanceId={decoration.instanceId}
          >
            <Component {...componentProps} />
          </PluginSlotMount>
        );
      })}
    </div>
  );
}
