import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@bb/shared-ui/button";
import type { JsonValue, PluginPendingInteraction } from "@bb/domain";
import { BbHttpError } from "@bb/sdk/browser";
import { PluginSlotMount } from "./PluginSlotMount";
import { resolvePendingInteraction } from "@/lib/plugin-slot-resolvers";
import { usePluginSlots } from "@/lib/plugin-slots";
import { sdk } from "@/lib/sdk";

interface PluginPendingInteractionComposerProps {
  interaction: PluginPendingInteraction;
}

/**
 * A pending interaction dies server-side in ways this client may never hear
 * about: the daemon interrupts every active plugin interaction on startup and
 * publishes that change to a hub nobody is subscribed to yet, and the
 * request's own ten-minute timeout fires with no guarantee the socket was up.
 * The list query is the only path back to the truth, so a dead question can
 * stay mounted as a live form until something else invalidates it.
 *
 * Two defenses, both local to the card:
 *   1. `expiresAt` is a death certificate the client already holds — schedule
 *      it and retire the card when it passes, with no server event needed.
 *   2. A conflict (409) or a missing interaction (404) is the server saying
 *      "that question is over". Treat it as the answer, not as an error
 *      string: the form goes away and the human reads a sentence.
 * The raw transport message ("HTTP 409: Pending interaction pint_... is
 * already interrupted") never reaches the screen in either case.
 */
function isInteractionGoneError(cause: unknown): boolean {
  return (
    cause instanceof BbHttpError &&
    (cause.status === 409 || cause.status === 404)
  );
}

export function PluginPendingInteractionComposer({
  interaction,
}: PluginPendingInteractionComposerProps) {
  const { pendingInteractions } = usePluginSlots();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gone, setGone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const origin = interaction.origin;
  const title = interaction.payload.title;
  const expiresAt = interaction.expiresAt ?? null;
  const slot = useMemo(
    () =>
      resolvePendingInteraction(
        pendingInteractions,
        origin.pluginId,
        origin.rendererId,
      ),
    [origin.pluginId, origin.rendererId, pendingInteractions],
  );

  // Retire on expiry without waiting for a server event. An already-passed
  // expiry runs through the same path as a zero-delay timeout, so a card
  // restored from cache after its deadline is answerable for at most one tick.
  useEffect(() => {
    if (expiresAt === null || gone) {
      return;
    }
    const timer = setTimeout(
      () => setGone(true),
      Math.max(0, expiresAt - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [expiresAt, gone]);

  const submit = useCallback(
    async (value: JsonValue) => {
      setSubmitting(true);
      setError(null);
      try {
        await sdk.threads.interactions.respond({
          interactionId: interaction.id,
          threadId: interaction.threadId,
          value,
        });
      } catch (cause) {
        if (isInteractionGoneError(cause)) {
          setGone(true);
        } else {
          setError(
            "That didn't go through. Check the connection and try again.",
          );
        }
        throw cause;
      } finally {
        setSubmitting(false);
      }
    },
    [interaction.id, interaction.threadId],
  );

  const cancel = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      await sdk.threads.interactions.cancel({
        interactionId: interaction.id,
        threadId: interaction.threadId,
      });
    } catch (cause) {
      if (isInteractionGoneError(cause)) {
        setGone(true);
      } else {
        setError(
          "Couldn't cancel this request. Check the connection and try again.",
        );
      }
      throw cause;
    } finally {
      setSubmitting(false);
    }
  }, [interaction.id, interaction.threadId]);

  if (dismissed) {
    return null;
  }

  return (
    <section
      data-plugin-interaction-card={interaction.id}
      data-plugin-interaction-dead={gone ? "1" : undefined}
      className="mb-2 rounded-lg border border-border bg-surface-recessed px-4 py-3 text-xs text-muted-foreground"
    >
      <header className="mb-4 min-w-0">
        <h3 className="text-pretty text-sm font-semibold text-foreground">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Requested by <span className="capitalize">{origin.pluginId}</span>
        </p>
      </header>
      {gone ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This request stopped waiting for an answer before you sent one, so
            nothing was changed. Run “{title}” again to pick it back up.
          </p>
          <Button
            type="button"
            variant="outline"
            data-plugin-interaction-exit="dismiss"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </Button>
        </div>
      ) : slot ? (
        <PluginSlotMount
          pluginId={slot.pluginId}
          slotKind="pendingInteraction"
          slotId={slot.id}
          crashFallback={
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                The plugin form crashed. Cancel this request to continue.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void cancel()}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          }
        >
          <fieldset disabled={submitting}>
            <slot.component
              interaction={{
                id: interaction.id,
                threadId: interaction.threadId,
                title,
                payload: interaction.payload.data,
                createdAt: interaction.createdAt,
                expiresAt,
              }}
              submit={submit}
              cancel={cancel}
            />
          </fieldset>
        </PluginSlotMount>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The plugin form is unavailable. Cancel this request to continue.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void cancel()}
            disabled={submitting}
          >
            Cancel
          </Button>
        </div>
      )}
      {error && !gone ? (
        <p
          className="mt-3 rounded-md border border-surface-destructive-border bg-surface-destructive px-2 py-1 text-xs text-destructive-text"
          aria-live="polite"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
