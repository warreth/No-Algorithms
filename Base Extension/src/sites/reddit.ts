import { SiteRule } from "./types";

export const redditRule: SiteRule = {
    domain: "reddit.com",
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