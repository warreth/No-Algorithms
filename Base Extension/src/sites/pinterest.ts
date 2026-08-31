import type { SiteRule } from "../core/types.ts";
import { mountFocusOverlay } from "../core/overlay.ts";

/**
 * Pinterest: keep pins, boards, profiles, search and the following feed;
 * remove the ranked "more ideas" home feed, Today articles, Ideas pages
 * and the endless video feed — all replaced by the focus overlay.
 */

const OVERLAY_ID = "noalg-pinterest-focus";

/** Ranked discovery routes (live-verified PWS routes: today.js, ideas.js). */
const BLOCKED_ROUTES = /^\/(today|ideas|videos|categories)(\/|$)/;

export const pinterestRule: SiteRule = {
  domain: "pinterest.com",
  onRouteChange: (pathname) => {
    const blocked = BLOCKED_ROUTES.test(pathname);
    document.documentElement.classList.toggle("noalg-pinterest-blocked", blocked);
    if (blocked) {
      mountFocusOverlay(OVERLAY_ID);
    } else {
      document.getElementById(OVERLAY_ID)?.remove();
    }
  },
  onInit: () => {
    pinterestRule.onRouteChange?.(location.pathname);
  },
  onMutation: () => {
    if (BLOCKED_ROUTES.test(location.pathname)) {
      document.documentElement.classList.add("noalg-pinterest-blocked");
      mountFocusOverlay(OVERLAY_ID);
    }
  }
};
