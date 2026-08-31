import type { SiteRule } from "./types.ts";
import { youtubeRule } from "../sites/youtube.ts";
import { instagramRule } from "../sites/instagram.ts";
import { redditRule } from "../sites/reddit.ts";
import { tiktokRule } from "../sites/tiktok.ts";
import { facebookRule } from "../sites/facebook.ts";
import { githubRule } from "../sites/github.ts";
import { snapchatRule } from "../sites/snapchat.ts";
import { xRule } from "../sites/x.ts";
import { threadsRule } from "../sites/threads.ts";
import { pinterestRule } from "../sites/pinterest.ts";
import { twitchRule } from "../sites/twitch.ts";

const siteRules: SiteRule[] = [
    youtubeRule,
    instagramRule,
    redditRule,
    tiktokRule,
    facebookRule,
    githubRule,
    snapchatRule,
    xRule,
    threadsRule,
    pinterestRule,
    twitchRule
];

/** Hostname matches when a registered domain is a suffix of it. */
export function getActiveRules(hostname: string): SiteRule[] {
    return siteRules.filter(rule => {
        const domains = Array.isArray(rule.domain) ? rule.domain : [rule.domain];
        return domains.some(d => hostname === d || hostname.endsWith("." + d));
    });
}
