import type { SiteRule } from "../core/types.ts";

/**
 * Instagram: keep the followed feed, DMs, stories, profiles and SEARCH;
 * remove Reels, Explore and every recommendation/ad unit in the feed.
 *
 * Detection is a denylist over robust, language-independent markers
 * (Follow CTA / Suggested label / Sponsored / Paid partnership / Ad /
 * collab byline). Verdicts latch per article so a settled post is never
 * rescanned, and markers are only trusted once the byline has rendered.
 */

const HIDE_ATTR = "data-noalg-hide";
const VERDICT_ATTR = "data-noalg-verdict";
const PENDING_ATTR = "data-noalg-pending";

const SUGGESTED_RE = /suggested (for you|posts?)/i;
const SPONSORED_RE = /^sponsored$/i;
const PAID_RE = /^paid partnership/i;
const AD_RE = /^Ad$/;
const FOLLOW_RE = /^(Follow|Follow Back|Follow back)$/;
const FOLLOWING_RE = /^(Following|Requested)$/;
const CTAS_RE = /^(learn more|shop now|install now|download|sign up|subscribe now|see more)$/i;

/** Time (ms) a new article must age before its verdict is trusted. */
const SETTLE_MS = 400;

/** Hard ceiling so a post whose markers never render still gets judged. */
const MAX_SETTLE_MS = 3000;

const REEL_VIEW_CLASS = "noalg-reel-view";

function articleText(article: Element): string {
  return (article.textContent || "").slice(0, 400);
}

function isSuggested(article: Element): boolean {
  return SUGGESTED_RE.test(articleText(article));
}

function isSponsored(article: Element): boolean {
  const els = article.querySelectorAll("span, div, a, [aria-label]");
  for (const el of els) {
    const t = (el.textContent || "").trim();
    if (t.length <= 4 && AD_RE.test(t)) return true;
    if (t.length <= 20 && SPONSORED_RE.test(t)) return true;
    if (t.length <= 40 && PAID_RE.test(t)) return true;
    const al = el.getAttribute("aria-label") || "";
    if (SPONSORED_RE.test(al) || PAID_RE.test(al)) return true;
    if (t.length <= 20 && CTAS_RE.test(t)) return true;
  }
  return false;
}

/** "Follow" CTA is rendered only for accounts you do NOT follow. */
function hasFollowCta(article: Element): boolean {
  for (const el of article.querySelectorAll("button, [role='button'], div, span, a")) {
    const t = (el.textContent || "").trim();
    if (t && t.length <= 12 && FOLLOW_RE.test(t) && !FOLLOWING_RE.test(t)) return true;
  }
  return false;
}

/** Collab posts ("alice and bob•2h") arrive unlabelled as recommendations;
 *  handles never contain spaces, so " and " before the byline bullet is one. */
function isCollab(article: Element): boolean {
  const txt = article.textContent || "";
  const dot = txt.indexOf("•");
  if (dot === -1 || dot > 120) return false;
  return /\sand\s/i.test(txt.slice(0, dot));
}

/** Byline marker: the <time> renders after the byline, so its presence
 *  means detection markers can be trusted. */
function bylineReady(article: Element): boolean {
  return article.querySelector("time") !== null;
}

function isRecommendation(article: Element): boolean {
  return isSuggested(article) || isSponsored(article) || hasFollowCta(article) || isCollab(article);
}

/** Hide the smallest wrapper that is solely for this article (parent with
 *  1–2 children) to avoid half-post artifacts and infinite spinners. */
function hideArticle(article: Element): void {
  article.setAttribute(HIDE_ATTR, "true");
  if (article.parentElement && article.parentElement.childElementCount <= 2) {
    article.parentElement.setAttribute(HIDE_ATTR, "true");
  }
}

/** Settle window per article; verdicts latch so settled posts are skipped.
 *  A pending article re-arms its own timeout — the settle clock doesn't
 *  depend on some other DOM mutation happening to schedule a re-scan. */
function scanArticles(): void {
  if (location.pathname.startsWith("/direct/")) return;

  document.querySelectorAll("article").forEach(article => {
    if (article.hasAttribute(VERDICT_ATTR)) return; // already judged — latch

    const ready = bylineReady(article);
    if (!ready && !article.hasAttribute(PENDING_ATTR)) {
      article.setAttribute(PENDING_ATTR, String(Date.now()));
    }
    if (article.hasAttribute(PENDING_ATTR)) {
      const age = Date.now() - parseInt(article.getAttribute(PENDING_ATTR)!, 10);
      if (!ready && age < SETTLE_MS) {
        setTimeout(() => scanArticles(), SETTLE_MS - age + 10);
        return; // still settling — retry when the window elapses
      }
    }

    const blocked = isRecommendation(article);
    article.setAttribute(VERDICT_ATTR, blocked ? "blocked" : "kept");
    if (blocked) hideArticle(article);
  });
}

/** Reel permalinks (shared into DMs) must not become a scrollable feed. */
function updateReelView(pathname: string): void {
  const isReel = /^\/reels?\//.test(pathname) || pathname.includes("/reel/");
  document.body.classList.toggle(REEL_VIEW_CLASS, isReel);
}

/** Hide the Reels sub-tab on profile pages. */
function hideProfileReelsTab(): void {
  document.querySelectorAll('a[href$="/reels/"]').forEach(link => {
    if (link.closest("main")) link.classList.add("noalg-hidden");
  });
}

export const instagramRule: SiteRule = {
  domain: "instagram.com",
  onInit: () => {
    // Block arrow-key scrolling in the single-reel viewer (opened from DMs).
    window.addEventListener(
      "keydown",
      (e) => {
        if (
          document.body.classList.contains(REEL_VIEW_CLASS) &&
          ["ArrowRight", "ArrowDown", "ArrowUp"].includes(e.key)
        ) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
  },
  onRouteChange: (pathname) => updateReelView(pathname),
  onMutation: () => {
    updateReelView(location.pathname);
    scanArticles();
    hideProfileReelsTab();
  }
};
