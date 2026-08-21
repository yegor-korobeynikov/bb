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
 */
export function MessageDecorations({ decorations }: MessageDecorationsProps) {
  if (decorations.length === 0) {
    return null;
  }
  return (
    <div className="mt-1 flex flex-col gap-1">
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
