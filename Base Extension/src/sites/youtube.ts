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
                // Only blur the algorithmic recommendation containers, not the entire sidebar 
                // so our custom info-card stays sharp and visible
                style.textContent = "#related, ytd-watch-next-secondary-results-renderer { filter: blur(10px) !important; pointer-events: none !important; }";
                document.head.appendChild(style);
            }
        } else if (videoEl.hasAttribute("theater") || videoEl.hasAttribute("playlist")) {
            // Remove blur if navigating to something that shouldn't be blurred
            const existingStyle = document.getElementById("no-alg-blur-style");
            if(existingStyle) existingStyle.remove();
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

            const sponsorLink = document.createElement("a");
            sponsorLink.className = "noalg-sponsor-link";
            sponsorLink.href = "https://github.com/sponsors/WarreTh";
            sponsorLink.target = "_blank";
            sponsorLink.rel = "noopener noreferrer";
            sponsorLink.textContent = "Support No Algorithms";
            sponsorLink.style.marginTop = "20px";
            sponsorLink.style.fontSize = "11px";
            sponsorLink.style.opacity = "0.4";
            sponsorLink.style.textDecoration = "none";
            sponsorLink.style.color = "inherit";
            sponsorLink.onmouseover = () => sponsorLink.style.opacity = "0.8";
            sponsorLink.onmouseout = () => sponsorLink.style.opacity = "0.4";

            sidebarEl.insertBefore(infoEl, sidebarEl.firstChild);
            infoEl.append(textEl1, textEl2, buttonEl, sponsorLink);

            buttonEl.addEventListener("click", () => {
                const searchbox = document.querySelector('[name="search_query"]') as HTMLElement | null;
                searchbox?.focus();
            });
        }
    }
};
