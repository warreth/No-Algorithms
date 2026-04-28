import { SiteRule } from "./types";

/**
 * Checks if a feed post unit is algorithmic (ad, sponsored, follow-suggestion, reel).
 * 
 * Facebook obfuscates visible text like "Sponsored" and "Follow" by splitting them
 * into individual characters across many <span> elements with decoy spans hidden
 * off-screen (position: absolute; top: 3em). We cannot rely on textContent matching.
 *
 * Instead we use structural signals that Facebook's own rendering pipeline exposes:
 *  - data-ad-rendering-role attributes  → present on ad/sponsored content
 *  - aria-label="Open reel in Reels Viewer" → reel embedded in feed
 *  - a "Follow" button next to the author name → not a friend/followed account
 *    (the Follow button text is NOT obfuscated — it sits in a plain <span>)
 */
function isAlgorithmicPost(post: Element): boolean {
    // 1. Ad / Sponsored: Facebook marks internal ad elements with data-ad-rendering-role
    if (post.querySelector('[data-ad-rendering-role]')) {
        return true;
    }

    // 2. Reel embedded in feed
    if (post.querySelector('[aria-label="Open reel in Reels Viewer"]')) {
        return true;
    }

    // 3. "Follow" button next to author = not a friend/page you follow.
    //    The Follow span text is unobfuscated (class x1fey0fg is the visible Follow label).
    //    We also check the role=button with x1qq9wsj which is the follow button container.
    if (post.querySelector('[role="button"][class*="x1qq9wsj"]')) {
        return true;
    }

    // 4. data-pagelet for suggested content units
    const pagelet = (post as HTMLElement).dataset?.pagelet || "";
    if (pagelet.includes("Suggested") || pagelet.includes("Recommendation")) {
        return true;
    }

    return false;
}

export const facebookRule: SiteRule = {
    domain: "facebook.com",
    onInit: () => {
        // Redirect /reel/* paths to home
        if (window.location.pathname.startsWith("/reel")) {
            window.location.replace("/");
        }
    },
    onMutation: () => {
        // Target feed post wrappers
        const feedPosts = document.querySelectorAll(
            'div[data-pagelet^="FeedUnit_"]:not(.noalgo-checked), ' +
            'div[aria-posinset]:not(.noalgo-checked)'
        );

        feedPosts.forEach(post => {
            post.classList.add("noalgo-checked");
            if (isAlgorithmicPost(post)) {
                (post as HTMLElement).style.display = "none";
            }
        });

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
};