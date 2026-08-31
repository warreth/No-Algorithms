import type { Settings, SiteRule } from "./types.ts";
import { CompiledPathRules, compilePathRules, isPathBlocked, shouldRewriteLink } from "./paths.ts";

/**
 * Site engine: loads one site's settings, watches the SPA route, and
 * dispatches to the active site rules. A single MutationObserver feeds the
 * debounced mutation batch; route changes are handled immediately.
 */
export class Engine {
  private settings: Settings | null = null;
  private rules: CompiledPathRules | null = null;
  private homeUrl = "/";
  private readonly activeRules: SiteRule[];
  private debounceTimer: number | null = null;

  constructor(private readonly location: Location, activeRules: SiteRule[]) {
    this.activeRules = activeRules;
  }

  async start(): Promise<void> {
    this.settings = await this.loadSettings();
    if (this.settings) {
      this.rules = compilePathRules(this.settings);
      this.homeUrl = this.location.origin + this.settings.home_path;
      this.redirectIfBlocked();
    }

    for (const rule of this.activeRules) rule.onInit?.();

    this.watchRoute();
    this.observeMutations();
  }

  /** Fetch sites/<site>/settings.json for the current origin, if any. */
  private async loadSettings(): Promise<Settings | null> {
    if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return null;
    const siteList: string[] = await (await fetch(chrome.runtime.getURL("sites/index.json"))).json();
    for (const folder of siteList) {
      if (!this.location.origin.includes(folder)) continue;
      const url = chrome.runtime.getURL(`sites/${folder}/settings.json`);
      return await (await fetch(url)).json();
    }
    return null;
  }

  // --- Redirection -----------------------------------------------------

  private redirectIfBlocked(): void {
    if (!this.settings || !this.rules) return;
    if (this.location.pathname + this.location.search === this.settings.home_path) return;
    if (isPathBlocked(this.location.pathname, this.rules)) {
      this.location.replace(this.homeUrl);
    }
  }

  // --- Link rewriting ---------------------------------------------------

  /** Rewrite anchor targets that point at blocked paths to the home path. */
  private rewriteLinks(root: ParentNode = document): void {
    if (!this.settings || !this.rules || !this.settings.website_name) return;
    const anchors = root.querySelectorAll<HTMLAnchorElement>("a[href]:not([data-noalg-seen])");
    for (const link of anchors) {
      link.dataset.noalgSeen = "1";
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:")) continue;

      let url: URL;
      try {
        url = new URL(href, this.location.origin);
      } catch {
        continue;
      }
      if (url.hostname !== this.location.hostname && !url.hostname.endsWith("." + this.settings.website_name)) continue;
      if (!shouldRewriteLink(url.pathname, this.rules)) continue;

      link.setAttribute("og_href", href);
      link.setAttribute("href", this.settings.home_path);
      link.dataset.noalgHome = "1";
    }
  }

  /** Force full navigation for links we rewrote (SPA sites would otherwise
   *  intercept the click and restore the original target). */
  private forceReroutedClicks = (event: MouseEvent): void => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const path = event.composedPath() as EventTarget[];
    const link = path.find((el): el is HTMLAnchorElement => el instanceof HTMLAnchorElement);
    if (!link || link.dataset.noalgHome !== "1") return;
    event.preventDefault();
    event.stopPropagation();
    this.location.assign(link.href);
  };

  // --- Title ------------------------------------------------------------

  private applyCustomTitle(): void {
    if (!this.settings?.custom_path_titles) return;
    for (const t of this.settings.custom_path_titles) {
      if (this.location.pathname === t.path && document.title !== t.title) {
        document.title = t.title;
        return;
      }
    }
  }

  // --- Route + mutation plumbing ----------------------------------------

  private onRouteChange(): void {
    this.redirectIfBlocked();
    for (const rule of this.activeRules) rule.onRouteChange?.(this.location.pathname);
    this.scheduleMutationBatch();
  }

  private watchRoute(): void {
    const engine = this;
    const { pushState, replaceState } = history;
    history.pushState = function (this: History, ...args: Parameters<typeof pushState>) {
      const result = pushState.apply(this, args);
      engine.onRouteChange();
      return result;
    };
    history.replaceState = function (this: History, ...args: Parameters<typeof replaceState>) {
      const result = replaceState.apply(this, args);
      engine.onRouteChange();
      return result;
    };
    window.addEventListener("popstate", () => this.onRouteChange());
    window.addEventListener("hashchange", () => this.onRouteChange());
  }

  private observeMutations(): void {
    document.addEventListener("click", this.forceReroutedClicks, true);
    const observer = new MutationObserver(() => this.scheduleMutationBatch());
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  /** One shared 150ms debounce + rAF for every mutation burst. */
  private scheduleMutationBatch(): void {
    if (this.debounceTimer !== null) return;
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      requestAnimationFrame(() => this.runMutationBatch());
    }, 150);
  }

  private runMutationBatch(): void {
    this.rewriteLinks();
    this.applyCustomTitle();
    for (const rule of this.activeRules) rule.onMutation?.();
  }
}
