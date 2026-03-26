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
                    // This means it is the desktop version since there is no search bar
                    main?.setAttribute("remove_from_search", "");
                } else if (main && main.children.length > 1) {
                    // Remove anything but the search bar for mobile
                    main.children[1]?.setAttribute("remove_from_search", "");
                }
            }
        }
    },
    intervals: [
        {
            intervalMs: 1000,
            action: () => {
                document.querySelectorAll("article").forEach(article => {
                    if (article.getAttribute("isRecommendation")) return;

                    const isRecommendation = [...article.querySelectorAll("*")].some(el => {
                        const txt = el.textContent?.toLowerCase() || "";
                        return txt.includes("follow") || txt.includes("suggested for you");
                    });

                    if (isRecommendation) {
                        article.setAttribute("isRecommendation", "");
                    }
                });
            }
        }
    ]
};
