import type { SiteRule } from "../core/types.ts";
import { mountFocusOverlay } from "../core/overlay.ts";

/**
 * X (Twitter): keep the Following timeline, posts, profiles and search;
 * remove the For You ranked feed, Explore and every recommendation
 * module ("Who to follow", "What's happening", topic suggestions).
 */

const OVERLAY_ID = "noalg-x-focus";

/** Pure discovery routes — search stays, it is a deliberate act. */
const OVERLAY_ROUTES = /^\/(explore|i\/trending)(\/|$)/;

/** True on the home page while the For You (ranked) tab is selected. */
function isForYouFeed(): boolean {
  if (location.pathname !== "/" && location.pathname !== "/home") return false;
  const selectedTab = document.querySelector(
    '[role="tablist"] [role="tab"][aria-selected="true"]'
  );
  if (!selectedTab) return false; // tabs not rendered yet — treat as safe
  return !/following/i.test(selectedTab.textContent || "");
}

/** Hide ranked-feed and recommendation surfaces. Idempotent. */
function hideSurfaces(): void {
  if (isForYouFeed()) {
    document.body.classList.add("noalg-x-foryou");
  } else {
    document.body.classList.remove("noalg-x-foryou");
  }

  // Right sidebar is pure recommendations on every route.
  document
    .querySelectorAll('[data-testid="sidebarColumn"]')
    .forEach(el => el.classList.add("noalg-hidden"));
}

export const xRule: SiteRule = {
  domain: ["x.com", "twitter.com"],
  onRouteChange: (pathname) => {
    if (OVERLAY_ROUTES.test(pathname)) {
      document.documentElement.classList.add("noalg-x-blocked");
      mountFocusOverlay(OVERLAY_ID);
    } else {
      document.documentElement.classList.remove("noalg-x-blocked");
      document.getElementById(OVERLAY_ID)?.remove();
    }
    hideSurfaces();
  },
  onInit: () => {
    xRule.onRouteChange?.(location.pathname);
  },
  onMutation: () => {
    hideSurfaces();
    if (OVERLAY_ROUTES.test(location.pathname)) {
      mountFocusOverlay(OVERLAY_ID);
    }
  }
};
