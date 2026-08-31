import type { SiteRule } from "../core/types.ts";
import { mountFocusOverlay } from "../core/overlay.ts";

const OVERLAY_ID = "noalg-tiktok-focus";

/** TikTok: entirely algorithmic; the whole app is replaced by the overlay. */
export const tiktokRule: SiteRule = {
  domain: "tiktok.com",
  onMutation: () => mountFocusOverlay(OVERLAY_ID)
};
