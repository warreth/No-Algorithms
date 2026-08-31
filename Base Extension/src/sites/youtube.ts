import { SiteRule } from "../core/types";

/** YouTube: subscriptions-only browsing. */
export const youtubeRule: SiteRule = {
  domain: "youtube.com",
  onMutation: () => {
    const videoEl = document.querySelector("ytd-watch-flexy");
    const sidebarEl = document.querySelector("#secondary-inner");
    if (!videoEl || !sidebarEl) return;

    const blurNeeded =
      !videoEl.hasAttribute("playlist") &&
      !sidebarEl.contains(document.querySelector("#chat-container"));

    const existing = document.getElementById("no-alg-blur-style");
    if (blurNeeded && !videoEl.hasAttribute("theater") && !existing) {
      const style = document.createElement("style");
      style.id = "no-alg-blur-style";
      style.textContent =
        "#related, ytd-watch-next-secondary-results-renderer { filter: blur(10px) !important; pointer-events: none !important; }";
      document.head.appendChild(style);
    } else if (!blurNeeded && existing) {
      existing.remove();
    }

    // "What next? YOU decide." card above the (blurred) recommendations.
    if (!document.querySelector("#info-card")) {
      const infoEl = document.createElement("div");
      infoEl.id = "info-card";
      infoEl.classList.add("noalg-info-card");

      const top = document.createElement("span");
      top.textContent = "What next?";
      top.id = "info-card-top-text";

      const main = document.createElement("span");
      main.textContent = "YOU decide.";
      main.id = "info-card-main-text";

      const button = document.createElement("button");
      button.textContent = "Search";
      button.id = "info-card-button";
      button.addEventListener("click", () => {
        (document.querySelector('[name="search_query"]') as HTMLElement | null)?.focus();
      });

      const sponsorLink = document.createElement("a");
      sponsorLink.className = "noalg-sponsor-link";
      sponsorLink.href = "https://github.com/sponsors/WarreTh";
      sponsorLink.target = "_blank";
      sponsorLink.rel = "noopener noreferrer";
      sponsorLink.textContent = "Support No Algorithms";

      sidebarEl.insertBefore(infoEl, sidebarEl.firstChild);
      infoEl.append(top, main, button, sponsorLink);
    }
  }
};
