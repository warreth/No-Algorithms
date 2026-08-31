// Engine redirect tests. The bundle runs in a bare `vm` context where the
// browser Location/history/DOM are test doubles; the Engine under test is
// the real shipped code. jsdom cannot perform navigation, so redirect
// assertions need a controllable location.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const bundle = readFileSync(new URL("../dist/main.js", import.meta.url), "utf8");

/** Boot the real bundle in a vm world with a recording Location. */
async function bootEngine(url, html) {
  const u = new URL(url);
  const replacements = [];
  const assignments = [];

  const location = {
    origin: u.origin,
    protocol: u.protocol,
    host: u.host,
    hostname: u.hostname,
    port: u.port,
    get pathname() { return u.pathname; },
    get search() { return u.search; },
    get href() { return u.href; },
    replace: x => replacements.push(x),
    assign: x => assignments.push(x)
  };

  const timers = [];
  const ctx = {
    location,
    replacements,
    assignments,
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
    Date, URL, RegExp, JSON, Promise, Math, Number, String, Object, Array,
    MutationObserver: class { observe() {} disconnect() {} },
    requestAnimationFrame: fn => setTimeout(fn, 0),
    history: { pushState() {}, replaceState() {} },
    addEventListener() {},
    removeEventListener() {},
    sessionStorage: {
      _s: {},
      getItem(k) { return this._s[k] ?? null; },
      setItem(k, v) { this._s[k] = String(v); }
    },
    fetch: async input => {
      const p = String(input).replace("chrome-extension://x/", "");
      if (p.startsWith("sites/")) {
        return { ok: true, json: async () => JSON.parse(readFileSync(new URL("../" + p, import.meta.url), "utf8")) };
      }
      throw new Error("unexpected fetch " + p);
    },
    document: {
      readyState: "complete",
      title: "",
      body: { classList: { add() {}, remove() {}, toggle() {}, contains: () => false }, appendChild() {} },
      documentElement: { classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
      createElement: () => ({
        style: {}, classList: { add() {} }, dataset: {},
        append() {}, setAttribute() {}, appendChild() {}, addEventListener() {}
      }),
      addEventListener() {},
      removeEventListener() {},
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null
    }
  };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  ctx.chrome = { runtime: { getURL: p => "chrome-extension://x/" + p } };

  vm.createContext(ctx);
  vm.runInContext(bundle, ctx);
  await new Promise(r => setTimeout(r, 300));
  return ctx;
}

// --- YouTube ---------------------------------------------------------------

{
  const ctx = await bootEngine("https://www.youtube.com/");
  assert.equal(ctx.replacements[0], "https://www.youtube.com/feed/subscriptions",
    "root redirects to subscriptions");
}
{
  const ctx = await bootEngine("https://www.youtube.com/shorts/abc123");
  assert.equal(ctx.replacements[0], "https://www.youtube.com/feed/subscriptions",
    "shorts redirect to subscriptions");
}
{
  const ctx = await bootEngine("https://www.youtube.com/watch?v=abc");
  assert.equal(ctx.replacements.length, 0, "watch pages are never redirected");
}

// --- Instagram ---------------------------------------------------------------

{
  const ctx = await bootEngine("https://www.instagram.com/reel/Cx123/");
  assert.equal(ctx.replacements[0], "https://www.instagram.com/", "reel permalink redirected");
}
{
  const ctx = await bootEngine("https://www.instagram.com/reels/Cx123/");
  assert.equal(ctx.replacements[0], "https://www.instagram.com/", "reels permalink redirected");
}
{
  const ctx = await bootEngine("https://www.instagram.com/direct/t/abc/");
  assert.equal(ctx.replacements.length, 0, "DMs never redirected");
}
{
  const ctx = await bootEngine("https://www.instagram.com/p/Cx123/");
  assert.equal(ctx.replacements.length, 0, "post permalinks never redirected");
}

// --- Snapchat ----------------------------------------------------------------

{
  const ctx = await bootEngine("https://www.snapchat.com/spotlight");
  assert.ok(ctx.replacements.includes("https://www.snapchat.com/web"),
    "consumer spotlight redirected to /web");
}
{
  const ctx = await bootEngine("https://web.snapchat.com/");
  assert.equal(ctx.replacements.length, 0, "chat web app never redirected");
}

console.log("engine.test: all assertions passed");
// The vm contexts keep live intervals; exit explicitly.
process.exit(0);
