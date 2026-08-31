import { SiteRule } from "../core/types";
import { mountFocusOverlay } from "../core/overlay";

/**
 * Snapchat: keep chat/DMs working on web.snapchat.com; remove the
 * Stories & Spotlight buttons (landing right rail "tCfts", per-conversation
 * header spotlight button), the story rail, and the consumer /spotlight,
 * /discover, /explore and /lens routes on www.snapchat.com.
 */

const OVERLAY_ID = "noalg-snapchat-focus";

/** Consumer (marketing) site routes that are pure algorithmic feeds. */
const CONSUMER_ROUTES = /^\/(spotlight|discover|explore|lens)(\/|$)/;

/** Chat web app: remove the landing right rail entirely (Stories button,
 *  Spotlight button, Games button) — chat stays fully usable. */
const WEB_RAIL_SELECTORS = [
  "div.tCfts",                       // landing right rail (Stories/Spotlight/Games)
  'div[title="View stories"]',       // stories button fallback
  'div[title="View Spotlight Stories"]',
  '[class*="WGPER"]',                // "Open Spotlight" button (conversation header)
  '[title="Open Spotlight"]'
];

/** Story thumbnails/rails in the chat list. */
const STORY_SELECTORS = [
  '[aria-label*="Stories" i]',
  '[class*="OwWqx"]'                 // stories button wrapper (bundle class)
];

const isChatWeb = () => location.hostname === "web.snapchat.com";

function removeWebRail(): void {
  if (!isChatWeb()) return;
  for (const sel of WEB_RAIL_SELECTORS) {
    document.querySelectorAll(sel).forEach(el => el.remove());
  }
  for (const sel of STORY_SELECTORS) {
    document.querySelectorAll(sel).forEach(el => {
      // Only remove story surfaces, never the chat conversation list itself.
      if (!el.closest("main")) el.remove();
    });
  }
}

export const snapchatRule: SiteRule = {
  domain: "snapchat.com",
  onRouteChange: (pathname) => {
    if (!isChatWeb() && CONSUMER_ROUTES.test(pathname)) {
      // Consumer pages are one big feed: swap the page for the overlay.
      document.documentElement.classList.add("noalg-snap-blocked");
      mountFocusOverlay(OVERLAY_ID);
    }
  },
  onInit: () => {
    removeWebRail();
    snapchatRule.onRouteChange?.(location.pathname);
  },
  onMutation: () => {
    removeWebRail();

    if (!isChatWeb() && CONSUMER_ROUTES.test(location.pathname)) {
      document.documentElement.classList.add("noalg-snap-blocked");
      mountFocusOverlay(OVERLAY_ID);
      document
        .querySelectorAll('#app, [data-e2e="tiktok-web-app"], #main-content, [data-testid="page-frame"]')
        .forEach(el => el.classList.add("noalg-hidden"));
    } else {
      document.documentElement.classList.remove("noalg-snap-blocked");
      document.getElementById(OVERLAY_ID)?.remove();
    }
  }
};
