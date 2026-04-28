import { SiteRule } from "./types";
import { createFocusOverlay } from "./utils";

const OVERLAY_ID = "noalgo-fb-overlay";

function isAlgorithmicPost(post: Element): boolean {
    if (post.querySelector('[data-ad-preview]')) return true;
    if (post.querySelector('[data-ad-comet-preview]')) return true;
    if (post.querySelector('[aria-label="Open reel in Reels Viewer"]')) return true;
    if (post.querySelector('[role="button"][class*="x1qq9wsj"]')) return true;

    const pagelet = (post as HTMLElement).dataset?.pagelet || "";
    if (pagelet.includes("Suggested") || pagelet.includes("Recommendation")) return true;

    return false;
}

/**
 * Injects the focus overlay into the feed container.
 * Targets the main feed role="feed" element, or falls back to the FeedUnit parent.
 */
function injectFeedOverlay(): void {
    if (document.getElementById(OVERLAY_ID)) return;

    // Facebook's main feed is a div/section with role="feed"
    const feedContainer = document.querySelector('[role="feed"]') as HTMLElement | null;
    if (!feedContainer) return;

    const overlay = createFocusOverlay(OVERLAY_ID);
    if (!overlay) return;

    overlay.style.cssText = `
        position: sticky;
        top: 0;
        z-index: 9999;
        background: var(--card-background, #fff);
        border: 1px solid var(--divider, #ddd);
        border-radius: 8px;
        padding: 40px 20px;
        text-align: center;
        margin-bottom: 16px;
    `;

    feedContainer.prepend(overlay);

    // Hide all direct post children inside the feed
    feedContainer.querySelectorAll<HTMLElement>(
        ':scope > div[data-pagelet^="FeedUnit_"], :scope > div[aria-posinset]'
    ).forEach(post => {
        post.classList.add("noalgo-hidden");
    });
}

function processPosts(): void {
    // On home feed: hide algo posts, show overlay
    const isHomeFeed = window.location.pathname === "/" || window.location.pathname === "/home";
    if (isHomeFeed) {
        injectFeedOverlay();
    }

    // Standard feed posts (home, groups)
    document.querySelectorAll<HTMLElement>(
        'div[data-pagelet^="FeedUnit_"]:not(.noalgo-checked), ' +
        'div[aria-posinset]:not(.noalgo-checked)'
    ).forEach(post => {
        post.classList.add("noalgo-checked");
        if (isAlgorithmicPost(post)) {
            post.classList.add("noalgo-hidden");
        }
    });

    // Re-check already-approved posts for lazy-loaded ad markers
    document.querySelectorAll<HTMLElement>(
        'div[data-pagelet^="FeedUnit_"].noalgo-checked:not(.noalgo-hidden), ' +
        'div[aria-posinset].noalgo-checked:not(.noalgo-hidden)'
    ).forEach(post => {
        if (isAlgorithmicPost(post)) {
            post.classList.add("noalgo-hidden");
        }
    });

    // Profile pages use a different structure — target the timeline posts
    // They sit inside a div with role="main" and contain user-post articles
    const isProfilePage = window.location.pathname.startsWith("/profile.php") ||
        (window.location.pathname.split("/").length === 2 && window.location.pathname !== "/");
    
    if (isProfilePage) {
        // On profile pages, show all posts (they are the user's own posts, not algorithmic)
        // Only hide reels sections if present
        document.querySelectorAll<HTMLElement>(
            '[data-pagelet="ProfileTimeline"] [aria-label="Open reel in Reels Viewer"]'
        ).forEach(reel => {
            const post = reel.closest<HTMLElement>('[data-pagelet^="FeedUnit_"], [aria-posinset]');
            if (post) post.classList.add("noalgo-hidden");
        });
    }

    // Hide comment input areas
    document.querySelectorAll(
        'div[aria-label="Write a comment"], ' +
        'div[aria-label^="Leave a comment"], ' +
        'div[aria-label^="Comment"]'
    ).forEach(el => {
        const wrapper = el.closest("form") || el.parentElement?.parentElement;
        if (wrapper) (wrapper as HTMLElement).style.display = "none";
    });
}

export const facebookRule: SiteRule = {
    domain: "facebook.com",
    onInit: () => {
        if (window.location.pathname.startsWith("/reel")) {
            window.location.replace("/");
        }
        processPosts();
    },
    onMutation: () => {
        processPosts();
    }
};