import type { SiteRule } from "../core/types.ts";
import { mountFocusOverlay } from "../core/overlay.ts";

/**
 * GitHub: keep code, issues, PRs, notifications and search; remove the
 * discovery surfaces — trending, explore, topics, collections, events,
 * sponsors explore — plus the repo Pulse page and the home "For you" feed.
 */

const OVERLAY_ID = "noalg-github-focus";

/** Discovery routes replaced by the focus overlay instead of a redirect
 *  (redirecting to / would land back on the For-you feed for logged-in users). */
const OVERLAY_ROUTES = /^\/(trending|topics|collections|events)(\/|$)/;
const REDIRECT_ROUTES = /^\/(sponsors\/explore|explore)(\/|$)/;

/** The logged-in home feed container (old and new dashboard variants). */
const FEED_SELECTORS = [
  "feed-container",                               // For-you feed (web component)
  "#dashboard > div > feed-container",            // dashboard variant
  '[data-target="feed-container.content"]',       // feed content slot
  ".js-feed-container"                            // legacy
];

/** Right-rail "Explore / discover" modules on the home page. */
const SIDE_RAIL_SELECTORS = [
  ".feed-sidebar",                                // recommendations column
  '[aria-label="Explore repositories"]'
];

function suppressHomeFeed(): void {
  if (location.pathname !== "/") return;

  for (const sel of FEED_SELECTORS) {
    document.querySelectorAll(sel).forEach(el => el.classList.add("noalg-hidden"));
  }
  for (const sel of SIDE_RAIL_SELECTORS) {
    document.querySelectorAll(sel).forEach(el => el.classList.add("noalg-hidden"));
  }
}

/** Hide every link into a blocked route (explore nav, footer links, cards). */
const BLOCKED_LINK_RE = /^\/(trending|topics|collections|events|sponsors\/explore|explore|feed)(\/|$)/;

function hideBlockedLinks(): void {
  // :not() keeps this incremental — already-seen anchors are skipped by
  // the selector engine itself instead of a JS loop.
  document
    .querySelectorAll<HTMLAnchorElement>("a[href]:not([data-noalg-link-seen])")
    .forEach(link => {
      link.dataset.noalgLinkSeen = "1";
      let pathname: string;
      try {
        pathname = new URL(link.getAttribute("href") || "", location.origin).pathname;
      } catch {
        return;
      }
      if (BLOCKED_LINK_RE.test(pathname)) link.classList.add("noalg-hidden");
    });
}

/** Repo "Insights > Pulse" — a short-term activity dopamine page. */
function isPulsePage(pathname: string): boolean {
  return /^\/[^/]+\/[^/]+\/pulse\/?$/.test(pathname);
}

export const githubRule: SiteRule = {
  domain: "github.com",
  onRouteChange: (pathname) => {
    if (REDIRECT_ROUTES.test(pathname)) {
      location.replace("/");
    } else if (OVERLAY_ROUTES.test(pathname)) {
      mountFocusOverlay(OVERLAY_ID);
    }
  },
  onInit: () => {
    githubRule.onRouteChange?.(location.pathname);
  },
  onMutation: () => {
    const pathname = location.pathname;

    // Overlay routes: cover the whole content area, every pass (idempotent).
    if (OVERLAY_ROUTES.test(pathname)) {
      mountFocusOverlay(OVERLAY_ID);
      document.querySelectorAll("main, #js-repo-pjax-container").forEach(el =>
        el.classList.add("noalg-hidden")
      );
    }

    if (isPulsePage(pathname)) {
      // Pulse offers no value beyond a scrollable activity feed — hide its
      // content but keep the repo nav so the user can navigate away.
      document
        .querySelectorAll("main > div, .repository-content, [data-hpc]")
        .forEach(el => el.classList.add("noalg-hidden"));
    }

    suppressHomeFeed();
    hideBlockedLinks();
  }
};
