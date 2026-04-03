// ============================================================
// No Algorithms - YouTube & Instagram Script
// Purpose: Remove algorithmic surfaces and redirect the user
//          to non-algorithmic browsing.
// ============================================================
import { Settings } from "./sites/types";
import { getActiveRules } from "./sites/registry";

class App {
  private settings!: Settings;
  private home_url!: string;
  private slash_is_blocked: boolean = false;
  private activeRules = getActiveRules(location.hostname);

  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.Start(), { once: true });
    } else {
      this.Start();
    }
  }

  // Load settings and inject CSS for the target site
  async set_up_settings() {
    const siteListResponse = await fetch(chrome.runtime.getURL("sites/index.json"));
    const siteFolders: string[] = await siteListResponse.json();

    for (const folder of siteFolders) {
      if (!location.origin.includes(folder)) continue;

      const settingsUrl = chrome.runtime.getURL(`sites/${folder}/settings.json`);

        const settingsResponse = await fetch(settingsUrl);

        this.settings = await settingsResponse.json();

      if (this.settings.blocked_paths && this.settings.blocked_paths.some(bp => bp === "/")) {
        this.slash_is_blocked = true;
      }
      break; 
    }
  }

  // Check if current website matches the configured site
  private Is_correct_website(): boolean {
    if (!this.settings) return false;
    return location.hostname.includes(this.settings.website_name);
  }

  // Determine if a given path matches a blocked path rule
  private IsPathBlocked(pathname: string, blockedPath: string): boolean {
    if (blockedPath.startsWith("exact:")) {
      return pathname === blockedPath.replace("exact:", "");
    }
    return pathname.includes(blockedPath) && blockedPath !== "/";
  }

  // Determine if the current path should be redirected
  private ShouldRedirect(pathname: string): boolean {
    if (!this.settings || !this.settings.blocked_paths) return false;
    for (const blockedPath of this.settings.blocked_paths) {
      if (pathname === "/" && this.slash_is_blocked) return true;
      if (this.IsPathBlocked(pathname, blockedPath)) return true;
    }
    return false;
  }

  // Redirect user to home path if on blocked path
  private Redirections(): void {
    if (!this.Is_correct_website()) return;
    if (this.ShouldRedirect(location.pathname)) {
      window.location.replace(this.home_url);
    }
  }

  // Rename document title based on custom path titles
  private RenameDocumentTitle(): void {
    if (!this.Is_correct_website() || !this.settings.custom_path_titles) return;

    for (const customTitle of this.settings.custom_path_titles) {
      if (location.pathname === customTitle.path && document.title !== customTitle.title) {
        document.title = customTitle.title;
        break;
      }
    }
  }

  // Reroute or remove links based on settings
  private RerouteLinks(root: Document | HTMLElement = document): void {
    if (!this.settings || !this.settings.blocked_paths) return;
    root.querySelectorAll?.("a[href]:not([data-noalg-processed])").forEach((link: Element) => {
        const dataset = (link as HTMLElement).dataset;
        if (dataset.noalgProcessed) return;

        const href = link.getAttribute("href");
        if (!href) return;

        let url: URL;
        try { url = new URL(href, location.origin); } catch {
            dataset.noalgProcessed = "1";
            return;
        }

        const hostname = url.hostname;
        if (!hostname.includes(this.settings.website_name)) {
            dataset.noalgProcessed = "1";
            return;
        }

        if (url.pathname === "/" && this.slash_is_blocked) {
            link.setAttribute("og_href", href); // store original href
            link.setAttribute("href", this.home_url);
            dataset.noalgHomeLink = "1";
            return;
        } else if (this.settings.blocked_paths.some(bp => bp !== "/" && this.IsPathBlocked(url.pathname, bp))) {
            link.setAttribute("og_href", href); // store original href
            link.setAttribute("href", this.home_url);
            dataset.noalgHomeLink = "1";
        }

        dataset.noalgProcessed = "1";
    });
  }

  // Force navigation to href of rerouted links
  private ForceReroutedLinks(event: MouseEvent): void {
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    
    const path = event.composedPath();
    const link = path.find(el => el instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;

    if (!link) return;

    // Only force behavior on our explicitly rerouted links.
    // Otherwise, we break Instagram's SPA reactivity (like Search/Notifications opening).
    if (link.dataset.noalgHomeLink !== "1") return;

    event.preventDefault();
    event.stopPropagation();
    window.location.assign(link.href);
  }

  // Run redirections on location change
  private RunOnLocationChanged(): void {
    this.Redirections();
  }

  // Setup listeners for history and hash changes
  private SetupLocationChangeListeners(): void {
    const { pushState, replaceState } = history;
    const self = this;

    history.pushState = function (...args: any[]): any {
      const result = pushState.apply(this, args as any);
      self.RunOnLocationChanged();
      return result;
    };

    history.replaceState = function (...args: any[]): any {
      const result = replaceState.apply(this, args as any);
      self.RunOnLocationChanged();
      return result;
    };

    window.addEventListener("popstate", () => this.RunOnLocationChanged());
    window.addEventListener("hashchange", () => this.RunOnLocationChanged());
  }

  // Start the app by loading settings and setting up observers
  public async Start(): Promise<void> {
    await this.set_up_settings().catch(err => {
      console.error("Failed to load settings", err);
    });
    
    if (this.settings) {
      this.home_url = `${location.protocol}//${location.host}${this.settings.home_path}`;
      this.Redirections();
    }

    this.SetupLocationChangeListeners();
    document.addEventListener("click", this.ForceReroutedLinks.bind(this), true);

    // Run active rule initializations
    for (const rule of this.activeRules) {
        if (rule.onInit && this.settings) rule.onInit(this.settings);
    }

    let timeoutId: number | null = null;
    const observer = new MutationObserver(() => {
      if (timeoutId === null) {
        timeoutId = window.setTimeout(() => {
          timeoutId = null;
          requestAnimationFrame(() => {
            this.RerouteLinks();
            this.RenameDocumentTitle();

            for (const rule of this.activeRules) {
                if (rule.onMutation && this.settings) rule.onMutation(this.settings);
            }
          });
        }, 150);
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

new App();