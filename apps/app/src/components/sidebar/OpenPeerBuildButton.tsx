import { Icon } from "@bb/shared-ui/icon";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar.js";
import { useIsProd } from "@/hooks/useAppMode";

/**
 * Opens the other build's window alongside this one — working from public,
 * public from working — so a bug reported from a demo can be compared side by
 * side with the fix in progress, with no terminal involved. Desktop only:
 * `window.bbDesktop` is undefined on the web build.
 */
export function OpenPeerBuildButton({ className }: { className?: string }) {
  const isProd = useIsProd();
  if (typeof window === "undefined" || window.bbDesktop === undefined) {
    return null;
  }
  const label = isProd ? "Open working build" : "Open public build";
  return (
    <SidebarMenuItem className="min-w-0">
      <SidebarMenuButton
        className={className}
        aria-label={label}
        tooltip={{ children: label, hidden: false, side: "top" }}
        onClick={() => window.bbDesktop?.openPeerBuild()}
      >
        <Icon name="AppWindow" />
        <span className="sr-only">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
