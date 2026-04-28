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

            if (!document.getElementById("noalg-reddit-focus")) {
                const overlay = document.createElement("div");
                overlay.id = "noalg-reddit-focus";
                
                const title = document.createElement("h1");
                title.textContent = "Time to Focus 📚";
                
                const subtitle = document.createElement("p");
                subtitle.textContent = "Read a book, learn something new, or build your dream project.";

                const sponsorLink = document.createElement("a");
                sponsorLink.className = "noalg-sponsor-link";
                sponsorLink.href = "https://github.com/sponsors/WarreTh";
                sponsorLink.target = "_blank";
                sponsorLink.rel = "noopener noreferrer";
                sponsorLink.textContent = "♥ Support No Algorithms";
                
                overlay.append(title, subtitle, sponsorLink);
                document.body.appendChild(overlay);
            }
        }
    }
};