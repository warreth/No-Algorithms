import { SiteRule } from "./types";

export const instagramRule: SiteRule = {
    domain: "instagram.com",
    onMutation: () => {
        // Tag recommendations dynamically when they appear in feed
        document.querySelectorAll("article").forEach(article => {
            if (article.getAttribute("isRecommendation")) return;

            const txt = article.textContent?.toLowerCase() || "";
            if (txt.includes("follow") || txt.includes("suggested for you")) {
                article.setAttribute("isRecommendation", "");
            }
        });
    }
};
