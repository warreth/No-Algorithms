import { SiteRule } from "./types";
import { createFocusOverlay } from "./utils";

export const tiktokRule: SiteRule = {
    domain: "tiktok.com",
    onInit: () => {
        // No specific init for tiktok currently
    },
    onMutation: () => {
        // Disable the whole site and show an overlay
        const overlay = createFocusOverlay("noalg-tiktok-focus");
        if (overlay) {
            document.body.appendChild(overlay);
        }
    }
};