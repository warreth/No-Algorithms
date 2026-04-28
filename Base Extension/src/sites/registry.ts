import { SiteRule } from "./types";
import { youtubeRule } from "./youtube";
import { instagramRule } from "./instagram";
import { redditRule } from "./reddit";
import { tiktokRule } from "./tiktok";
import { facebookRule } from "./facebook";

export const siteRules: SiteRule[] = [
    youtubeRule,
    instagramRule,
    redditRule,
    tiktokRule,
    facebookRule
];

export function getActiveRules(hostname: string): SiteRule[] {
    return siteRules.filter(rule => hostname.includes(rule.domain));
}
