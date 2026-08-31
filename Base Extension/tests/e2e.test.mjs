// Real-browser e2e test: loads the built Chrome extension into a real
// Chromium and drives it against live sites. Requires `npm run build:all`
// first. Uses channel:"chromium" (full build) — the headless shell does not
// load extensions.
import assert from "node:assert/strict";
import { chromium } from "playwright";

import { fileURLToPath } from "node:url";
const EXT_PATH = fileURLToPath(new URL("../build/chrome", import.meta.url));
const results = [];
const check = (name, fn) => results.push([name, fn]);

async function withExtensionPage(url, fn) {
  const ctx = await chromium.launchPersistentContext("/tmp/noalg-e2e-profile", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${EXT_PATH}`,
      `--load-extension=${EXT_PATH}`,
      "--no-sandbox"
    ],
    timeout: 60000
  });
  try {
    const page = ctx.pages()[0] || (await ctx.newPage());
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await fn(page);
  } finally {
    await ctx.close();
  }
}

// --------------------------------------------------------------------------
// YouTube: content script runs on a watch page (timer + engine armed).
// --------------------------------------------------------------------------
check("youtube: extension active on watch page", async () => {
  await withExtensionPage("https://www.youtube.com/watch?v=aqz-KE-bpKQ", async page => {
    await page.waitForSelector("#noalg-page-timer", { timeout: 15000 });
  });
});

// --------------------------------------------------------------------------
// GitHub: /trending gets the focus overlay; the repo page stays usable.
// --------------------------------------------------------------------------
check("github: trending page gets focus overlay", async () => {
  await withExtensionPage("https://github.com/trending", async page => {
    await page.waitForSelector("#noalg-github-focus", { timeout: 15000 });
    await page.waitForFunction(
      () => document.querySelector("main")?.classList.contains("noalg-hidden"),
      { timeout: 10000 }
    );
  });
});

check("github: repo page stays untouched", async () => {
  await withExtensionPage("https://github.com/WarreTh/No-Algorithms", async page => {
    await page.waitForSelector("#noalg-page-timer", { timeout: 15000 });
    const overlay = await page.$("#noalg-github-focus");
    assert.ok(!overlay, "no overlay on repo pages");
    const readme = await page.$("main");
    assert.ok(readme, "repo main content present");
  });
});

// --------------------------------------------------------------------------
// Snapchat: consumer /spotlight redirects to the chat app at /web.
// --------------------------------------------------------------------------
check("snapchat: consumer spotlight redirected to /web", async () => {
  await withExtensionPage("https://www.snapchat.com/spotlight", async page => {
    await page.waitForURL(/\/web/, { timeout: 20000 });
  });
});

// --------------------------------------------------------------------------
// Twitch: browse root and /directory redirect to /directory/following;
// channel pages stay untouched.
// --------------------------------------------------------------------------
check("twitch: directory redirects to following", async () => {
  await withExtensionPage("https://www.twitch.tv/directory", async page => {
    await page.waitForURL(/\/directory\/following/, { timeout: 20000 });
  });
});

check("twitch: channel page stays untouched", async () => {
  await withExtensionPage("https://www.twitch.tv/esl_csgo", async page => {
    await page.waitForSelector("#noalg-page-timer", { timeout: 20000 });
    assert.ok(!page.url().includes("following"), "channel page not redirected");
  });
});

// --------------------------------------------------------------------------
// Pinterest: /today gets the focus overlay; profile pages stay clean.
// --------------------------------------------------------------------------
check("pinterest: today page gets focus overlay", async () => {
  await withExtensionPage("https://www.pinterest.com/today/", async page => {
    await page.waitForSelector("#noalg-pinterest-focus", { timeout: 20000 });
  });
});

check("pinterest: profile page stays clean", async () => {
  await withExtensionPage("https://www.pinterest.com/github/", async page => {
    await page.waitForSelector("#noalg-page-timer", { timeout: 20000 });
    const overlay = await page.$("#noalg-pinterest-focus");
    assert.ok(!overlay, "no overlay on profiles");
  });
});

// --------------------------------------------------------------------------
// Threads: home feed gets the focus overlay (whole feed is ranked).
// --------------------------------------------------------------------------
check("threads: home feed gets focus overlay", async () => {
  await withExtensionPage("https://www.threads.net/", async page => {
    await page.waitForSelector("#noalg-threads-focus", { timeout: 20000 });
  });
});

// --------------------------------------------------------------------------
// X: x.com/twitter.com hard-block headless-datacenter requests with
// ERR_HTTP_RESPONSE_CODE_FAILURE (curl gets 200, real Chromium does not),
// so live e2e cannot drive it from this environment. X coverage lives in
// dom.test.mjs (explore overlay, For You detection, sidebar hiding).
// --------------------------------------------------------------------------

let failed = 0;
for (const [name, fn] of results) {
  try {
    await fn();
    console.log(`e2e ok   - ${name}`);
  } catch (err) {
    failed++;
    console.error(`e2e FAIL - ${name}: ${err.message.split("\n")[0]}`);
  }
}
if (failed > 0) process.exit(1);
console.log("e2e.test: done");
