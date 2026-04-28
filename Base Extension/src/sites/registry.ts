import { SiteRule } from "./types";
import { youtubeRule } from "./youtube";
import { instagramRule } from "./instagram";
import { redditRule } from "./reddit";

export const siteRules: SiteRule[] = [
    youtubeRule,
    instagramRule,
    redditRule
];

export function getActiveRules(hostname: string): SiteRule[] {
    return siteRules.filter(rule => hostname.includes(rule.domain));
}
