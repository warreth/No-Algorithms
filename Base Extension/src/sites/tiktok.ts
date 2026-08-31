import { SiteRule } from "../core/types";
import { mountFocusOverlay } from "../core/overlay";

const OVERLAY_ID = "noalg-tiktok-focus";

/** TikTok: entirely algorithmic; the whole app is replaced by the overlay. */
export const tiktokRule: SiteRule = {
  domain: "tiktok.com",
  onMutation: () => mountFocusOverlay(OVERLAY_ID)
};
