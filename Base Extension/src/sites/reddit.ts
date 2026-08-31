import { SiteRule } from "../core/types";
import { mountFocusOverlay } from "../core/overlay";

const OVERLAY_ID = "noalg-reddit-focus";

/** Reddit: post pages only; the home feed is replaced by the focus overlay. */
export const redditRule: SiteRule = {
  domain: "reddit.com",
  onInit: () => {
    // Force the modern shell; old/new/sh variants lack our DOM anchors.
    if (["old.reddit.com", "new.reddit.com", "sh.reddit.com"].includes(location.hostname)) {
      location.hostname = "www.reddit.com";
    }
  },
  onRouteChange: (pathname) => {
    if (!pathname.includes("/comments/")) return;
    document.body.classList.remove("noalg-post-page");
    document.getElementById(OVERLAY_ID)?.remove();
  },
  onMutation: () => {
    const isPostPage = location.pathname.includes("/comments/");
    document.body.classList.toggle("noalg-post-page", isPostPage);
    if (!isPostPage) mountFocusOverlay(OVERLAY_ID);
  }
};
