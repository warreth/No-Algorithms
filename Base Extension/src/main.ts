// ============================================================
// No Algorithms - YouTube Script
// Purpose: Remove algorithmic surfaces and redirect the user
//          to subscriptions-only browsing.
// ============================================================

interface PathTitle {
  path: string;
  title: string;
}

interface Settings {
  website_name: string;
  home_path: string;
  blocked_paths: string[];
  remove_links_to_path: string[]
  custom_path_titles: PathTitle[];
}

class App {
  private settings!: Settings;

  private home_url!: string;

  constructor() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.Start(), { once: true });
    } else {
      this.Start();
    }

    console.log("Running constructor...");
  }

  // Load settings and inject CSS for the target site
  async set_up_settings() {
    const siteListResponse = await fetch(chrome.runtime.getURL("sites/index.json"));
    const siteFolders: string[] = await siteListResponse.json();
    console.log(`Site folders: ${siteFolders}`);

    for (const folder of siteFolders) {
      const settingsUrl = chrome.runtime.getURL(`sites/${folder}/settings.json`);
      const cssUrl = chrome.runtime.getURL(`sites/${folder}/style.css`);

      const settingsResponse = await fetch(settingsUrl);
      const cssResponse = await fetch(cssUrl);

      this.settings = await settingsResponse.json();
      const css = await cssResponse.text();
      this.Inject(css);
      break; // stop after first found site
    }
  }

  //#region Helper Functions

  // Inject CSS into document head
  private Inject(css: string): void {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    console.log("Injected:\n" + css);
  }

  // Check if current website matches the configured site
  private Is_correct_website(): boolean {
    return location.hostname.includes(this.settings.website_name);
  }

  //#endregion

  //#region Redirections

  // Determine if the current path should be redirected
  private ShouldRedirect(pathname: string): boolean {
    for (const blockedPath of this.settings.blocked_paths) {
      if (pathname === blockedPath) return true;
      if (pathname.startsWith(blockedPath)) return false;
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

  //#endregion

  //#region Title Renaming

  // Rename document title based on custom path titles
  private RenameDocumentTitle(): void {
    if (!this.Is_correct_website()) return;

    for (const customTitle of this.settings.custom_path_titles) {
      if (location.pathname === customTitle.path && document.title !== customTitle.title) {
        document.title = customTitle.title;
        break;
      }
    }
  }

  //#endregion

  //#region Rerouting Links

  // Reroute or remove links based on settings (fixed version)
  private RerouteLinks(root: Document | HTMLElement = document): void {
    root.querySelectorAll("a[href]").forEach(link => {
        const dataset = link.dataset as DOMStringMap;
        if (dataset.noalgProcessed) return; // skip already processed

        const href = link.getAttribute("href");
        if (!href) return;

        // Remove links that start with remove_links_to_path
        if (this.settings.remove_links_to_path.some(p => href.startsWith(p))) {
            link.parentElement?.remove();
            dataset.noalgProcessed = "1";
            return;
        }

        let url: URL;
        try { url = new URL(href, location.origin); } catch {
            dataset.noalgProcessed = "1";
            return;
        }

        // Only target YouTube links
        const hostname = url.hostname;
        if (!(hostname === "youtube.com" || hostname.endsWith(".youtube.com"))) {
            dataset.noalgProcessed = "1";
            return;
        }

        // Redirect blocked paths, handle root "/" specially
        if (url.pathname === "/" && this.settings.blocked_paths.includes("/")) {
            link.setAttribute("href", this.home_url);
            console.log(url.pathname);
            dataset.noalgHomeLink = "1";
        } else if (this.settings.blocked_paths.some(bp => bp !== "/" && (url.pathname === bp || url.pathname.startsWith(bp)))) {
            link.setAttribute("href", this.home_url);
            console.log(url.pathname);
            dataset.noalgHomeLink = "1";
        }

        // Mark as processed
        dataset.noalgProcessed = "1";
    });
  }

  // Force navigation to href of rerouted links
  private ForceReroutedLinks(event: MouseEvent): void {
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const path = event.composedPath();

    const link = path.find(el =>
        el instanceof HTMLAnchorElement
    ) as HTMLAnchorElement | undefined;

    if (!link) {
      console.error("Link not found!", path);
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    window.location.assign(link.href);
  }

  //#endregion

  //#region Unneccesary Visual Functions
  // Adjust playlist location and blur sidebar if needed
  private MovePlaylistLocation(root: Document | HTMLElement = document): void {
    const videoEl = document.querySelector("ytd-watch-flexy") as HTMLElement | null;
    const sidebarEl = document.querySelector("#secondary-inner") as HTMLElement | null;
    if (!videoEl || !sidebarEl) return;

    if (!videoEl.hasAttribute("playlist") && !sidebarEl.contains(document.querySelector("#chat-container") as HTMLElement | null)) {
      const style = document.createElement("style");
      style.textContent = "#secondary { filter: blur(10px) }";
      document.head.appendChild(style);
      return;
    }
    if (videoEl.hasAttribute("theater")) return;

    videoEl.removeAttribute("is-two-columns_");
    videoEl.setAttribute("is_single_column_", "");
  }

  // Add info card to recommendations sidebar
  private AddInfoCardToRecommendations(): void {
    const sidebarEl = document.querySelector("#secondary-inner") as HTMLElement | null;
    if (!sidebarEl) return;
    if (document.querySelector("#info-card")) return;

    const infoEl = document.createElement("div");
    infoEl.id = "info-card";
    infoEl.classList.add("info-card");

    const textEl1 = document.createElement("span");
    textEl1.textContent = "What next?";
    textEl1.id = "info-card-top-text";

    const textEl2 = document.createElement("span");
    textEl2.textContent = "YOU decide.";
    textEl2.id = "info-card-main-text";

    const buttonEl = document.createElement("button");
    buttonEl.textContent = "Search";
    buttonEl.id = "info-card-button";

    sidebarEl.insertBefore(infoEl, sidebarEl.firstChild);
    infoEl.append(textEl1, textEl2, buttonEl);

    buttonEl.addEventListener("click", () => {
      const searchbox = document.querySelector('[name="search_query"]') as HTMLElement | null;
      searchbox?.focus();
    });
  }
  //#endregion

  //#region Run On Location Change Listener

  // Run redirections on location change
  private RunOnLocationChanged(): void {
    this.Redirections();
  }

  // Setup listeners for history and hash changes
  private SetupLocationChangeListeners(): void {
    const { pushState, replaceState } = history;
    const self = this;

    history.pushState = function (...args: any[]): any {
      const result = pushState.apply(this, args);
      self.RunOnLocationChanged();
      return result;
    };

    history.replaceState = function (...args: any[]): any {
      const result = replaceState.apply(this, args);
      self.RunOnLocationChanged();
      return result;
    };

    window.addEventListener("popstate", () => this.RunOnLocationChanged());
    window.addEventListener("hashchange", () => this.RunOnLocationChanged());
  }

  //#endregion

  // Start the app by loading settings and setting up observers
  public async Start(): Promise<void> {
    await this.set_up_settings().catch(err => console.error("Failed to load settings", err));
    this.home_url = `${location.protocol}//${location.host}${this.settings.home_path}`

    this.Redirections();
    this.AddInfoCardToRecommendations();

    this.SetupLocationChangeListeners();

    document.addEventListener("click", this.ForceReroutedLinks.bind(this), true);

    const observer = new MutationObserver(() => {
      requestAnimationFrame(() => {
        this.RerouteLinks();
        this.AddInfoCardToRecommendations();
        this.RenameDocumentTitle();
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
}

const app = new App();

console.log("Running app...");
