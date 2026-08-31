// DOM integration tests: run the real bundle in jsdom against realistic
// per-site fixture HTML and assert the engine + site rules behave.
// Run: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const bundle = readFileSync(new URL("../dist/main.js", import.meta.url), "utf8");


/** Wire a chrome.runtime stub. In a real browser getURL() resolves
 *  against the extension's own base (chrome-extension://<id>/), never the
 *  page URL — the stub mirrors that with a fixed fake base. */
const EXT_BASE = "chrome-extension://noalg.test/";
function chromeStub(dom) {
  const { window } = dom;
  window.chrome = {
    runtime: {
      getURL: p => EXT_BASE + p.replace(/^\//, ""),
      lastError: null
    }
  };
}

/** Load dist/main.js in the jsdom window with fetch patched to the fs. */
function boot(dom) {
  const { window } = dom;
  chromeStub(dom);

  window.fetch = async (input) => {
    // getURL returned chrome-extension://noalg.test/sites/...; map that
    // onto the real sites/ directory at the project root.
    const path = String(input).slice(EXT_BASE.length);
    if (path.startsWith("sites/")) {
      const file = new URL("../" + path, import.meta.url);
      try {
        return { ok: true, json: async () => JSON.parse(readFileSync(file, "utf8")) };
      } catch {
        return { ok: false, json: async () => { throw new Error("404 " + file.href); } };
      }
    }
    throw new Error("unexpected fetch " + String(input));
  };

  window.eval(bundle);
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Wait until fn() truthy, up to ms. */
async function waitFor(fn, ms = 3000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (fn()) return true;
    await sleep(50);
  }
  return fn();
}

function makeDom(url, html) {
  const dom = new JSDOM(html, { url, runScripts: "outside-only", pretendToBeVisual: true });
  // jsdom has no MutationObserver timing guarantees; flush via rAF shim.
  return dom;
}

// --------------------------------------------------------------------------
// 1. Reddit: home feed gets the overlay; post pages keep content.
// --------------------------------------------------------------------------
{
  const dom = makeDom("https://www.reddit.com/", `<!doctype html><html><body>
    <div id="main-content"><shreddit-feed>posts</shreddit-feed></div>
  </body></html>`);
  boot(dom);
  const doc = dom.window.document;
  assert.ok(await waitFor(() => doc.getElementById("noalg-reddit-focus")), "overlay mounted on home");
  assert.ok(doc.getElementById("main-content"), "main content still present (CSS hides it)");

  // Navigate to a post page via pushState (engine patches history).
  dom.window.history.pushState({}, "", "/r/sub/comments/abc/post_title/");
  await sleep(300);
  assert.ok(doc.body.classList.contains("noalg-post-page"), "post page class applied");
  assert.ok(!doc.getElementById("noalg-reddit-focus"), "overlay removed on post page");
  console.log("reddit DOM test passed");
}

// --------------------------------------------------------------------------
// 2. Instagram: suggested posts are hidden, followed posts kept; search nav
//    links survive; SPA navigation to /reels/ gets blocked attributes.
// --------------------------------------------------------------------------
{
  const dom = makeDom("https://www.instagram.com/", `<!doctype html><html><body>
    <nav>
      <a href="/">Home</a>
      <a href="/explore/">Explore</a>
      <a href="/reels/">Reels</a>
      <a href="/direct/inbox/">DMs</a>
    </nav>
    <main>
      <article><header><span>friend_user</span><time>2h</time></header><p>real post</p></article>
      <article><header><span>suggested_user</span><span>Suggested for you</span><time>3h</time></header></article>
      <article><header><span>ad_user</span><span>Sponsored</span><time>1h</time></header></article>
      <article><header><span>cta_user</span><button>Follow</button><time>5h</time></header></article>
    </main>
  </body></html>`);
  boot(dom);
  const doc = dom.window.document;

  // Give the settle window (400ms) plus the debounce a moment to judge.
  await waitFor(() => [...doc.querySelectorAll("article")].every(a => a.getAttribute("data-noalg-verdict")), 4000);
  const articles = [...doc.querySelectorAll("article")];
  const verdict = a => a.getAttribute("data-noalg-verdict");

  assert.equal(verdict(articles[0]), "kept", "followed post kept");
  assert.equal(verdict(articles[1]), "blocked", "Suggested for you blocked");
  assert.equal(verdict(articles[2]), "blocked", "Sponsored blocked");
  assert.equal(verdict(articles[3]), "blocked", "Follow CTA blocked");

  // Explore / Reels links are rewritten home; DMs untouched.
  const links = [...doc.querySelectorAll("nav a")];
  assert.equal(links[2].getAttribute("og_href"), "/reels/", "reels link stored");
  assert.equal(links[2].getAttribute("href"), "/", "reels link rewritten to home");
  assert.equal(links[1].getAttribute("og_href"), "/explore/", "explore link stored");
  assert.equal(links[3].getAttribute("og_href"), null, "DMs untouched");

  // SPA route to a reel permalink toggles the reel-view class.
  dom.window.history.pushState({}, "", "/direct/t/thread123/");
  await sleep(100);
  assert.ok(!doc.body.classList.contains("noalg-reel-view"), "DM route is not reel view");
  dom.window.history.pushState({}, "", "/reel/Cx123/");
  await sleep(300);
  assert.ok(doc.body.classList.contains("noalg-reel-view"), "reel permalink gets reel view");
  console.log("instagram DOM test passed");
}

// --------------------------------------------------------------------------
// 3. YouTube: blocked root redirects to /feed/subscriptions. jsdom cannot
//    perform cross-document navigation, so the redirect itself is covered by
//    the unit test (engine.test); here we assert the engine armed itself
//    for the site (link rewriting + rules compile) on a non-blocked path.
// --------------------------------------------------------------------------
{
  const dom = makeDom("https://www.youtube.com/watch?v=abc", `<!doctype html><html><body>
    <ytd-app><a href="/shorts/xyz">a short</a><a href="/watch?v=next">next video</a></ytd-app>
  </body></html>`);
  boot(dom);
  const doc = dom.window.document;
  assert.ok(await waitFor(() => doc.querySelector('a[og_href="/shorts/xyz"]'), 4000),
    "shorts link rewritten");
  const short = doc.querySelector('a[og_href="/shorts/xyz"]');
  assert.equal(short.getAttribute("href"), "/feed/subscriptions", "shorts link goes to subscriptions");
  const next = doc.querySelector('a[href="/watch?v=next"]');
  assert.ok(next, "watch link intact");
  assert.equal(next.getAttribute("og_href"), null, "watch link not rewritten");
  console.log("youtube DOM test passed");
}

// --------------------------------------------------------------------------
// 4. GitHub: trending page gets overlay + hidden content; repo pages stay.
// --------------------------------------------------------------------------
{
  const dom = makeDom("https://github.com/trending", `<!doctype html><html><body>
    <main><article class="Box-row">trending repo</article></main>
  </body></html>`);
  boot(dom);
  const doc = dom.window.document;
  assert.ok(await waitFor(() => doc.getElementById("noalg-github-focus")), "overlay on trending");
  assert.ok(await waitFor(() => doc.querySelector("main").classList.contains("noalg-hidden")),
    "main hidden on trending");

  const dom2 = makeDom("https://github.com/WarreTh/No-Algorithms", `<!doctype html><html><body>
    <main id="js-repo-pjax-container"><div class="repository-content">readme</div></main>
  </body></html>`);
  boot(dom2);
  const doc2 = dom2.window.document;
  await sleep(400);
  assert.ok(!doc2.querySelector("main").classList.contains("noalg-hidden"), "repo page untouched");
  assert.ok(!doc2.getElementById("noalg-github-focus"), "no overlay on repo page");
  console.log("github DOM test passed");
}

// --------------------------------------------------------------------------
// 5. Snapchat web: landing rail and spotlight buttons removed, chat kept.
// --------------------------------------------------------------------------
{
  const dom = makeDom("https://web.snapchat.com/", `<!doctype html><html><body>
    <div id="root">
      <div class="DexGI"><div class="tCfts"><button title="View stories">Stories</button><button title="View Spotlight Stories">Spotlight</button></div></div>
      <div class="chat-list"><div class="conversation">Friend chat</div></div>
      <div class="WGPER" title="Open Spotlight"></div>
    </div>
  </body></html>`);
  boot(dom);
  const doc = dom.window.document;
  await waitFor(() => !doc.querySelector(".tCfts"), 3000);
  assert.ok(!doc.querySelector(".tCfts"), "landing rail removed");
  assert.ok(!doc.querySelector('[title="Open Spotlight"]'), "spotlight button removed");
  assert.ok(doc.querySelector(".conversation"), "chat list intact");

  // Consumer route: content hidden, overlay up.
  const dom2 = makeDom("https://www.snapchat.com/spotlight", `<!doctype html><html><body>
    <div data-testid="page-frame"><div id="main-content">spotlight feed</div></div>
  </body></html>`);
  boot(dom2);
  const doc2 = dom2.window.document;
  assert.ok(await waitFor(() => doc2.getElementById("noalg-snapchat-focus")), "overlay on consumer spotlight");
  assert.ok(doc2.documentElement.classList.contains("noalg-snap-blocked"), "consumer page masked");
  console.log("snapchat DOM test passed");
}

// --------------------------------------------------------------------------
// 6. Timer mounts on every site.
// --------------------------------------------------------------------------
{
  const dom = makeDom("https://www.tiktok.com/", `<!doctype html><html><body>
    <div id="app">fyp</div>
  </body></html>`);
  boot(dom);
  const doc = dom.window.document;
  assert.ok(await waitFor(() => doc.getElementById("noalg-tiktok-focus")), "tiktok overlay");
  assert.ok(await waitFor(() => doc.getElementById("noalg-page-timer")), "timer mounted");
  await sleep(1200);
  const text = doc.getElementById("noalg-page-timer").textContent;
  assert.match(text, /^0?0?:\d{2}$/, "timer ticks (" + text + ")");
  console.log("timer DOM test passed");
}

console.log("dom.test: all assertions passed");
// jsdom keeps engine intervals alive after the assertions; exit explicitly.
process.exit(0);
