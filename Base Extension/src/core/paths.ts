import type { Settings } from "./types.ts";

/**
 * Blocked-path rule semantics:
 *   "exact:/foo"  -> pathname must equal /foo
 *   "/foo"        -> pathname must start with /foo
 *   "/"           -> the site root only (treated as exact by the engine)
 *
 * Rules are compiled once into a single RegExp per settings object.
 */
export interface CompiledPathRules {
  /** True when the bare site root ("/") is blocked. */
  rootBlocked: boolean;
  /** Matches any non-root path considered blocked. */
  blocked: RegExp | null;
  /** Matches any path whose links should be rewritten to the home path. */
  removeLinks: RegExp | null;
}

function compile(paths: string[]): { rootBlocked: boolean; re: RegExp | null } {
  const exact: string[] = [];
  const prefixes: string[] = [];
  let rootBlocked = false;

  for (const raw of paths) {
    if (raw === "exact:/" || raw === "/") {
      rootBlocked = true;
      continue;
    }
    if (raw.startsWith("exact:")) {
      const p = raw.slice("exact:".length);
      // Escape regex metacharacters; trailing slash is optional.
      const body = p.replace(/[.+*?^${}()|[\]\\]/g, "\\$&").replace(/\/$/, "");
      exact.push(`^${body}\\/?$`);
    } else {
      // Prefix match; tolerate an optional trailing slash on segment boundaries.
      const body = raw.replace(/[.+*?^${}()|[\]\\]/g, "\\$&").replace(/\/$/, "");
      prefixes.push(`^${body}(\\/|$)`);
    }
  }

  const parts = [...exact, ...prefixes];
  return { rootBlocked, re: parts.length ? new RegExp(parts.join("|")) : null };
}

export function compilePathRules(settings: Settings): CompiledPathRules {
  const blocked = compile(settings.blocked_paths);
  const removeLinks = compile(settings.remove_links_to_path);
  return {
    rootBlocked: blocked.rootBlocked || removeLinks.rootBlocked,
    blocked: blocked.re,
    removeLinks: removeLinks.re
  };
}

/** Is this pathname blocked (i.e. should the page redirect to home)? */
export function isPathBlocked(pathname: string, rules: CompiledPathRules): boolean {
  if (pathname === "/" || pathname === "") return rules.rootBlocked;
  return rules.blocked !== null && rules.blocked.test(pathname);
}

/** Should links to this pathname be rewritten to the home path? */
export function shouldRewriteLink(pathname: string, rules: CompiledPathRules): boolean {
  if (pathname === "/" || pathname === "") return rules.rootBlocked;
  return rules.removeLinks !== null && rules.removeLinks.test(pathname);
}
