import { SiteRule } from "./types";

export const redditRule: SiteRule = {
    domain: "reddit.com",
    onInit: () => {
        if (location.hostname === "old.reddit.com" || location.hostname === "new.reddit.com" || location.hostname === "sh.reddit.com") {
            location.hostname = "www.reddit.com";
        }
    },
    onMutation: () => {
        // Only enable opening of direct links to posts
        const isPostPage = location.pathname.includes("/comments/");
        
        if (isPostPage) {
            document.body.classList.add("noalg-post-page");
        } else {
            document.body.classList.remove("noalg-post-page");
        }
    }
};