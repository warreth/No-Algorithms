// Unit tests for the path-rule compiler. Run: npm test
import assert from "node:assert/strict";
import type { Settings } from "../src/core/types.ts";
import { compilePathRules, isPathBlocked, shouldRewriteLink } from "../src/core/paths.ts";
import { getActiveRules } from "../src/core/registry.ts";

function rulesFor(partial: Partial<Settings>): ReturnType<typeof compilePathRules> {
  const settings: Settings = {
    website_name: "test",
    home_path: "/home",
    blocked_paths: [],
    remove_links_to_path: [],
    ...partial
  };
  return compilePathRules(settings);
}

// --- blocked paths -------------------------------------------------------

{
  const r = rulesFor({ blocked_paths: ["exact:/reels/", "exact:/reels", "/explore"] });

  // exact rules
  assert.ok(isPathBlocked("/reels", r));
  assert.ok(isPathBlocked("/reels/", r));
  assert.ok(!isPathBlocked("/reels/Cx123/", r), "exact must not be a prefix");
  assert.ok(!isPathBlocked("/reels123", r), "exact must not substring-match");

  // prefix rules
  assert.ok(isPathBlocked("/explore", r));
  assert.ok(isPathBlocked("/explore/", r));
  assert.ok(isPathBlocked("/explore/people", r), "prefix covers subpaths");
  assert.ok(!isPathBlocked("/explorer", r), "prefix must respect the segment boundary");

  // unrelated paths
  assert.ok(!isPathBlocked("/direct/inbox", r));
  assert.ok(!isPathBlocked("/p/Cx123", r));
}

{
  // root blocking (YouTube-style)
  const r = rulesFor({ blocked_paths: ["/shorts", "/"] });
  assert.ok(isPathBlocked("/", r), "bare root must be blocked");
  assert.ok(isPathBlocked("/shorts", r));
  assert.ok(isPathBlocked("/shorts/abc123", r));
  assert.ok(!isPathBlocked("/feed/subscriptions", r));
}

{
  // regex metacharacters in paths are escaped
  const r = rulesFor({ blocked_paths: ["/r/all"] });
  assert.ok(isPathBlocked("/r/all", r));
  assert.ok(!isPathBlocked("/r/xll", r));
}

// --- link rewriting ------------------------------------------------------

{
  const r = rulesFor({
    remove_links_to_path: ["exact:/", "/r/popular", "/r/all", "exact:/sponsors/explore", "exact:/trending"]
  });

  assert.ok(shouldRewriteLink("/", r), "root link rewrite");
  assert.ok(shouldRewriteLink("/r/popular", r));
  assert.ok(shouldRewriteLink("/r/all/comments/xyz", r), "prefix rewrite covers subpaths");
  assert.ok(shouldRewriteLink("/sponsors/explore", r));
  assert.ok(shouldRewriteLink("/trending", r));
  assert.ok(!shouldRewriteLink("/trending/developers", r), "exact rule must not prefix-match");
  assert.ok(!shouldRewriteLink("/user/repo", r));
  assert.ok(!shouldRewriteLink("/r/python", r), "other subreddits untouched");
}

// --- empty rules ---------------------------------------------------------

{
  const r = rulesFor({});
  assert.ok(!isPathBlocked("/", r));
  assert.ok(!isPathBlocked("/anything", r));
  assert.ok(!shouldRewriteLink("/", r));
}

// --- registry -----------------------------------------------------------

{
  const yt = getActiveRules("www.youtube.com");
  assert.equal(yt.length, 1);
  assert.equal(yt[0].domain, "youtube.com");

  assert.equal(getActiveRules("youtube.com").length, 1, "apex domain matches");
  assert.equal(getActiveRules("evil-youtube.com").length, 0, "must not substring-match");
  assert.equal(getActiveRules("youtube.com.evil.tld").length, 0, "suffix attack blocked");
  assert.equal(getActiveRules("notyoutube.com").length, 0);

  // both snapchat hosts hit the one rule
  assert.equal(getActiveRules("web.snapchat.com").length, 1);
  assert.equal(getActiveRules("www.snapchat.com").length, 1);
}

console.log("paths.test: all assertions passed");
