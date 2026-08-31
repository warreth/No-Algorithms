import { SiteRule } from "./types";
import { youtubeRule } from "../sites/youtube";
import { instagramRule } from "../sites/instagram";
import { redditRule } from "../sites/reddit";
import { tiktokRule } from "../sites/tiktok";
import { facebookRule } from "../sites/facebook";
import { githubRule } from "../sites/github";
import { snapchatRule } from "../sites/snapchat";

const siteRules: SiteRule[] = [
    youtubeRule,
    instagramRule,
    redditRule,
    tiktokRule,
    facebookRule,
    githubRule,
    snapchatRule
];

/** Hostname matches when the registered domain is a suffix of it. */
export function getActiveRules(hostname: string): SiteRule[] {
    return siteRules.filter(rule => hostname === rule.domain || hostname.endsWith("." + rule.domain));
}
