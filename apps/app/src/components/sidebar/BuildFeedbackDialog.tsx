import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";
import { Button } from "@bb/shared-ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bb/shared-ui/dialog";
import { Icon } from "@bb/shared-ui/icon";
import { Textarea } from "@bb/shared-ui/textarea";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.js";
import { useIsProd } from "@/hooks/useAppMode";
import { useRouteState } from "@/hooks/useRouteState";
import { useIncognito } from "@/lib/incognito";
import { getRecentErrors } from "@/lib/recent-errors";
import { useSubmitBuildFeedback } from "@/hooks/queries/system-queries";

/**
 * The public build's half of the feedback channel: everything except the
 * note is gathered here (route, thread, incognito state, recent console
 * errors) so filing a report mid-demo never asks the reporter to describe
 * their own context.
 */
export function BuildFeedbackButton({ className }: { className?: string }) {
  const isProd = useIsProd();
  const [open, setOpen] = useState(false);
  if (!isProd) return null;
  return (
    <>
      <SidebarMenuItem className="min-w-0">
        <SidebarMenuButton
          className={className}
          aria-label="Send report to the working build"
          tooltip={{
            children: "Send report to the working build",
            hidden: false,
            side: "top",
          }}
          onClick={() => setOpen(true)}
        >
          <Icon name="Sent" />
          <span className="sr-only">Send report to the working build</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <BuildFeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function BuildFeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [note, setNote] = useState("");
  const location = useLocation();
  const { threadId } = useRouteState();
  const [incognito] = useIncognito();
  const submitBuildFeedback = useSubmitBuildFeedback();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedNote = note.trim();
    if (trimmedNote.length === 0 || submitBuildFeedback.isPending) return;
    submitBuildFeedback.mutate(
      {
        note: trimmedNote,
        route: location.pathname,
        threadId: threadId ?? null,
        incognito,
        recentErrors: getRecentErrors(),
      },
      {
        onSuccess: () => {
          toast.success("Sent — it'll show up as a thread in the working build.");
          setNote("");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report</DialogTitle>
          <DialogDescription>
            What happened? This screen, the build and any recent errors are
            attached automatically.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Textarea
            autoFocus
            rows={5}
            placeholder="The header on Today gets cut off on a narrow window…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={submitBuildFeedback.isPending}
          />
          <DialogFooter>
            <Button
              type="submit"
              disabled={note.trim().length === 0 || submitBuildFeedback.isPending}
            >
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
