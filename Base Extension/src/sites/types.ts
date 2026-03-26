export interface PathTitle {
  path: string;
  title: string;
}

export interface Settings {
  website_name: string;
  home_path: string;
  blocked_paths: string[];
  remove_links_to_path: string[];
  custom_path_titles: PathTitle[];
}

export interface SiteRule {
  /** The domain to match, e.g. "youtube.com" or "instagram.com" */
  domain: string;

  /** Run once when the site is first matched and initialized */
  onInit?: (settings: Settings) => void;

  /** Run every time the DOM is mutated */
  onMutation?: (settings: Settings) => void;

  /** 
   * An array of intervals to run.
   * `intervalMs` is the delay in ms, default is 1000ms.
   */
  intervals?: {
    intervalMs: number;
    action: (settings: Settings) => void;
  }[];
}
