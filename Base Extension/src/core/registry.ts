import type { SiteRule } from "./types.ts";
import { youtubeRule } from "../sites/youtube.ts";
import { instagramRule } from "../sites/instagram.ts";
import { redditRule } from "../sites/reddit.ts";
import { tiktokRule } from "../sites/tiktok.ts";
import { facebookRule } from "../sites/facebook.ts";
import { githubRule } from "../sites/github.ts";
import { snapchatRule } from "../sites/snapchat.ts";

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
