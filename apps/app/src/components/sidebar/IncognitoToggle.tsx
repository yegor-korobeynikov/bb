import { Icon } from "@bb/shared-ui/icon";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.js";
import { useIncognito } from "@/lib/incognito";
import { useIsProd } from "@/hooks/useAppMode";

/**
 * The eye: show the product on real data with client-identifying names
 * replaced by stable stand-ins.
 *
 * Only in the public build. In the working build the operator is looking at
 * their own workspace and masking it would just make the app harder to use —
 * and a toggle that is present but pointless invites the "what does this do?"
 * question mid-demo, which is exactly the moment it must not arrive.
 */
export function IncognitoToggle({
  className,
}: {
  className?: string;
}) {
  const isProd = useIsProd();
  const [on, setOn] = useIncognito();
  if (!isProd) return null;
  return (
    <SidebarMenuItem className="min-w-0">
      <SidebarMenuButton
        className={className}
        aria-label={on ? "Show real names" : "Hide client names"}
        aria-pressed={on}
        data-state={on ? "on" : "off"}
        tooltip={{
          children: on ? "Showing stand-in names" : "Hide client names",
          hidden: false,
          side: "top",
        }}
        onClick={() => setOn(!on)}
      >
        <Icon name={on ? "EyeOff" : "Eye"} />
        <span className="sr-only">
          {on ? "Show real names" : "Hide client names"}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/**
 * A standing reminder that names on screen are stand-ins — so a screenshot
 * taken during a demo cannot later be mistaken for real client data.
 */
export function IncognitoBadge() {
  const isProd = useIsProd();
  const [on] = useIncognito();
  if (!isProd || !on) return null;
  return (
    <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      Incognito
    </span>
  );
}
