/** Per-site configuration loaded from sites/<site>/settings.json. */
export interface PathTitle {
  path: string;
  title: string;
}

export interface Settings {
  website_name: string;
  home_path: string;
  /** Paths that trigger an immediate redirect to home_path. */
  blocked_paths: string[];
  /** Paths whose links get rewritten to home_path. */
  remove_links_to_path: string[];
  custom_path_titles?: PathTitle[];
}

/** A per-site behaviour module. All callbacks are optional. */
export interface SiteRule {
  /** Domain suffix to match, e.g. "youtube.com". */
  domain: string;
  /** Run once when the site is first matched and the engine starts. */
  onInit?: () => void;
  /** Run on every DOM mutation batch. Must be cheap and idempotent. */
  onMutation?: () => void;
  /** Run immediately when the SPA route changes (before content settles). */
  onRouteChange?: (pathname: string) => void;
}
