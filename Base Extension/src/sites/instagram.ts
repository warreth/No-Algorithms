import { SiteRule } from "./types";

export const instagramRule: SiteRule = {
    domain: "instagram.com",
    onMutation: () => {
        const path = location.pathname;
        if (path.startsWith("/explore")) {
            if (path.includes("/search")) {
                const searchResults = document.querySelector("ul");
                searchResults?.children[0]?.setAttribute("remove_from_search", "");
            } else {
                const main = document.querySelector("main");
                if (main?.children?.length === 1) {
                    main?.setAttribute("remove_from_search", "");
                } else if (main && main.children.length > 1) {
                    main.children[1]?.setAttribute("remove_from_search", "");
                }
            }
        }

        // Tag recommendations dynamically when they appear
        document.querySelectorAll("article").forEach(article => {
            if (article.getAttribute("isRecommendation")) return;

            const txt = article.textContent?.toLowerCase() || "";
            if (txt.includes("follow") || txt.includes("suggested for you")) {
                article.setAttribute("isRecommendation", "");
            }
        });
    }
};
