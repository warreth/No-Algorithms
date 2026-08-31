import type { SiteRule } from "../core/types.ts";
import { mountFocusOverlay } from "../core/overlay.ts";

/**
 * Threads: the whole home feed is ranked "For you" with no chronological
 * alternative, so the feed surface is replaced by the focus overlay.
 * Profiles (@user) and post permalinks stay fully usable.
 */

const OVERLAY_ID = "noalg-threads-focus";

/** Routes that keep working: profiles, posts, login. Everything else on
 *  the root is the ranked feed. */
const KEEP_ROUTES = /^\/(@|post|login|signup|developer|help|privacy|terms|api)/;

function isFeedPage(pathname: string): boolean {
  return pathname === "/" || pathname === "/feed" || pathname.startsWith("/explore");
}

/** Threads lives on threads.com; threads.net 301s there, so the rule
 *  registers under the .com domain only. */
export const threadsRule: SiteRule = {
  domain: "threads.com",
  onRouteChange: (pathname) => {
    document.body.classList.toggle("noalg-threads-blocked", isFeedPage(pathname));
    if (isFeedPage(pathname)) {
      mountFocusOverlay(OVERLAY_ID);
    } else {
      document.getElementById(OVERLAY_ID)?.remove();
    }
  },
  onInit: () => {
    threadsRule.onRouteChange?.(location.pathname);
  },
  onMutation: () => {
    if (isFeedPage(location.pathname)) {
      document.body.classList.add("noalg-threads-blocked");
      mountFocusOverlay(OVERLAY_ID);
    }
  }
};
