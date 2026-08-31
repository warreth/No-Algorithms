import type { SiteRule } from "../core/types.ts";

/**
 * Twitch: keep channel pages, search and clips; the ranked browse feed
 * (home, /directory shelves) redirects to /directory/following via the
 * engine's path rules — the YouTube pattern, no bespoke logic needed.
 * The rule module only guards surfaces the redirect cannot reach.
 */

/** Recommendation slots that survive on kept pages. */
const AD_SLOT_SELECTORS = [
  '[data-a-target="browse-banner-ad-slot"]',
  '[data-a-target="prime-offers-icon"]',
  '[data-a-target="side-nav-featured"]'
];

function hideAdSlots(): void {
  for (const sel of AD_SLOT_SELECTORS) {
    document
      .querySelectorAll(sel)
      .forEach(el => el.classList.add("noalg-hidden"));
  }
}

export const twitchRule: SiteRule = {
  domain: "twitch.tv",
  onInit: () => hideAdSlots(),
  onMutation: () => hideAdSlots()
};
