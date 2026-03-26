import { SiteRule } from "./types";
import { youtubeRule } from "./youtube";
import { instagramRule } from "./instagram";

export const siteRules: SiteRule[] = [
    youtubeRule,
    instagramRule
];

export function getActiveRules(hostname: string): SiteRule[] {
    return siteRules.filter(rule => hostname.includes(rule.domain));
}
