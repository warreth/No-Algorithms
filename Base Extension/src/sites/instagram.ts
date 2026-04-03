import { SiteRule } from "./types";

if (!(window as any).__noAlgInstaListenerAdded) {
    (window as any).__noAlgInstaListenerAdded = true;
    window.addEventListener("keydown", (e) => {
        if (
            document.body.classList.contains("noalg-reel-view") &&
            (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowUp")
        ) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, true);
}

export const instagramRule: SiteRule = {
    domain: "instagram.com",
    onMutation: () => {
        // Intercept single reel viewer (from DMs or Explore) to prevent scrolling
        if (location.pathname.includes("/reel/") || location.pathname.includes("/reels/")) {
            document.body.classList.add("noalg-reel-view");
        } else {
            document.body.classList.remove("noalg-reel-view");
        }

        if (location.pathname.includes("/direct/") || document.body.classList.contains("noalg-reel-view")) return;

        // Tag recommendations dynamically when they appear in feed
        document.querySelectorAll("article").forEach(article => {
            if (article.getAttribute("isRecommendation")) return;

            // Only look in the header to avoid catching text in captions
            const header = article.querySelector("header") || article;

            // Better universal detection: Suggested posts and Ads have a "Close" (X) button in their header
            // Normal posts from followed accounts only have the "More options" (...) button.
            const hasCloseButton = header.querySelector(
                'svg[aria-label="Close"], svg[aria-label="Hide"], svg[aria-label="Sluiten"], svg[aria-label="Verbergen"]'
            );
            if (hasCloseButton) {
                article.setAttribute("isRecommendation", "true");
                return;
            }

            // Fallback: Check text for known English markers
            const elements = Array.from(header.querySelectorAll("span, div"));
            let isRecommendation = false;
            for (const el of elements) {
                // Ignore elements that have nested elements
                if (el.children.length === 0 && el.textContent) {
                    const txt = el.textContent.trim().toLowerCase();
                    if (
                        txt === "suggested for you" || 
                        txt === "suggested post" || 
                        txt === "because you liked" || 
                        txt === "because you follow" ||
                        txt === "voorgesteld voor jou" ||
                        txt === "voorgesteld bericht"
                    ) {
                        isRecommendation = true;
                        break;
                    }
                }
            }
            if (isRecommendation) {
                article.setAttribute("isRecommendation", "true");
            } else {
                article.setAttribute("isRecommendation", "false");
            }
        });
    }
};
