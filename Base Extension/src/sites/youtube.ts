import { SiteRule } from "./types";

export const youtubeRule: SiteRule = {
    domain: "youtube.com",
    onMutation: () => {
        // Adjust playlist location and blur sidebar if needed
        const videoEl = document.querySelector("ytd-watch-flexy") as HTMLElement | null;
        const sidebarEl = document.querySelector("#secondary-inner") as HTMLElement | null;
        if (!videoEl || !sidebarEl) return;

        if (!videoEl.hasAttribute("playlist") && !sidebarEl.contains(document.querySelector("#chat-container") as HTMLElement | null)) {
            let existingStyle = document.getElementById("no-alg-blur-style");
            if (!existingStyle) {
                const style = document.createElement("style");
                style.id = "no-alg-blur-style";
                style.textContent = "#secondary { filter: blur(10px) }";
                document.head.appendChild(style);
            }
        } else if (videoEl.hasAttribute("theater") || videoEl.hasAttribute("playlist")) {
            // Remove blur if navigating to something that shouldn't be blurred
            const existingStyle = document.getElementById("no-alg-blur-style");
            if(existingStyle) existingStyle.remove();
        }

        if (!videoEl.hasAttribute("theater")) {
            videoEl.removeAttribute("is-two-columns_");
            videoEl.setAttribute("is_single_column_", "");
        }

        // Add info card to recommendations sidebar
        if (!document.querySelector("#info-card")) {
            const infoEl = document.createElement("div");
            infoEl.id = "info-card";
            infoEl.classList.add("info-card");

            const textEl1 = document.createElement("span");
            textEl1.textContent = "What next?";
            textEl1.id = "info-card-top-text";

            const textEl2 = document.createElement("span");
            textEl2.textContent = "YOU decide.";
            textEl2.id = "info-card-main-text";

            const buttonEl = document.createElement("button");
            buttonEl.textContent = "Search";
            buttonEl.id = "info-card-button";

            sidebarEl.insertBefore(infoEl, sidebarEl.firstChild);
            infoEl.append(textEl1, textEl2, buttonEl);

            buttonEl.addEventListener("click", () => {
                const searchbox = document.querySelector('[name="search_query"]') as HTMLElement | null;
                searchbox?.focus();
            });
        }
    }
};
