import { SiteRule } from "../core/types";
import { createFocusOverlay } from "../core/overlay";

const OVERLAY_ID = "noalgo-fb-overlay";

function isAlgorithmicPost(post: Element): boolean {
  if (post.querySelector('[data-ad-preview], [data-ad-comet-preview]')) return true;
  if (post.querySelector('[aria-label="Open reel in Reels Viewer"]')) return true;
  if (post.querySelector('[role="button"][class*="x1qq9wsj"]')) return true;
  const pagelet = (post as HTMLElement).dataset?.pagelet || "";
  return pagelet.includes("Suggested") || pagelet.includes("Recommendation");
}

function hideCommentBoxes(): void {
  document
    .querySelectorAll<HTMLElement>(
      'div[aria-label="Write a comment"], div[aria-label^="Leave a comment"], div[aria-label^="Comment"]'
    )
    .forEach(el => {
      const wrapper = el.closest("form") || el.parentElement?.parentElement;
      if (wrapper) wrapper.style.display = "none";
    });
}

function processPosts(): void {
  const isHomeFeed = ["/", "/home"].includes(location.pathname);
  if (isHomeFeed) injectFeedOverlay();

  document
    .querySelectorAll<HTMLElement>(
      'div[data-pagelet^="FeedUnit_"]:not(.noalgo-checked), div[aria-posinset]:not(.noalgo-checked)'
    )
    .forEach(post => {
      post.classList.add("noalgo-checked");
      if (isAlgorithmicPost(post)) post.classList.add("noalgo-hidden");
    });

  // Re-check approved posts: ad markers hydrate late.
  document
    .querySelectorAll<HTMLElement>(
      'div[data-pagelet^="FeedUnit_"].noalgo-checked:not(.noalgo-hidden), div[aria-posinset].noalgo-checked:not(.noalgo-hidden)'
    )
    .forEach(post => {
      if (isAlgorithmicPost(post)) post.classList.add("noalgo-hidden");
    });

  // Profile timelines stay visible except reels.
  document
    .querySelectorAll<HTMLElement>('[data-pagelet="ProfileTimeline"] [aria-label="Open reel in Reels Viewer"]')
    .forEach(reel => {
      reel.closest<HTMLElement>('[data-pagelet^="FeedUnit_"], [aria-posinset]')?.classList.add("noalgo-hidden");
    });

  hideCommentBoxes();
}

/** Facebook's feed container gets the uniform overlay prepended, then all
 *  direct posts hidden — the home feed is pure ranking. */
function injectFeedOverlay(): void {
  if (document.getElementById(OVERLAY_ID)) return;
  const feedContainer = document.querySelector<HTMLElement>('[role="feed"]');
  if (!feedContainer) return;

  const overlay = createFocusOverlay(OVERLAY_ID);
  if (!overlay) return;
  overlay.classList.add("noalg-overlay--inline");
  feedContainer.prepend(overlay);

  feedContainer
    .querySelectorAll<HTMLElement>(':scope > div[data-pagelet^="FeedUnit_"], :scope > div[aria-posinset]')
    .forEach(post => post.classList.add("noalgo-hidden"));
}

/** Facebook: kill the ranked feed, reels, watch, gaming; keep profiles. */
export const facebookRule: SiteRule = {
  domain: "facebook.com",
  onInit: () => {
    if (location.pathname.startsWith("/reel")) location.replace("/");
    processPosts();
  },
  onMutation: () => processPosts()
};
