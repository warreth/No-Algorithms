// ============================================================
// No Algorithms - YouTube Script
// Purpose: Remove algorithmic surfaces and redirect the user
//          to subscriptions-only browsing.
// ============================================================

// ------------------------------------------------------------
// Environment Detection
// ------------------------------------------------------------

// Check if the current page is a YouTube host
const isYouTubeHost =
  location.hostname === "youtube.com" ||
  location.hostname.endsWith(".youtube.com");

// Target subscriptions page
const subscriptionsPath = "/feed/subscriptions";
const subscriptionsUrl = `${location.protocol}//${location.host}${subscriptionsPath}`;

// ------------------------------------------------------------
// Global State
// ------------------------------------------------------------

let observer;
let previousLocationHref = location.href;

// ============================================================
// Redirection Logic
// ============================================================

/**
 * Redirect algorithmic entry points (home + shorts)
 * to the subscriptions feed.
 */
function redirections() {
  if (!isYouTubeHost) return;

  // Redirect homepage
  if (location.pathname === "/") {
    window.location.replace(subscriptionsUrl);
  }

  // Redirect shorts pages
  if (location.pathname.startsWith("/shorts")) {
    window.location.replace(subscriptionsUrl);
  }

  // Keep title clean on subscriptions page
  if (location.pathname === subscriptionsPath) {
    document.title = "YouTube";
  }
}


// ============================================================
// Link Rewriting
// ============================================================

/**
 * Rewrite any "home" links to instead point to subscriptions.
 * Also removes Shorts navigation links.
 */
function redirectHomeLinks(root = document) {
  root.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    let url;
    try {
      url = new URL(href, location.origin);
    } catch {
      return;
    }

    const isHomePath = url.pathname === "/" && !url.search && !url.hash;

    const isYouTubeUrl =
      url.hostname === "youtube.com" || url.hostname.endsWith(".youtube.com");

    // Rewrite home links to subscriptions
    if (isHomePath && isYouTubeUrl) {
      link.setAttribute("href", subscriptionsUrl);
      link.dataset.noalgHomeLink = "1";
    }

    // Remove shorts links entirely
    else if (href.startsWith("/shorts")) {
      link.parentElement?.remove();
    }
  });
}


// ============================================================
// Click Interception
// ============================================================

/**
 * Force navigation to subscriptions if a rewritten
 * "home" link is clicked.
 */
function forceSubscriptionsNavigation(event) {
  if (event.button !== 0) return; // Only left click
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const link = event.target.closest('a[data-noalg-home-link="1"]');
  if (!link) return;

  event.preventDefault();
  event.stopPropagation();

  window.location.assign(subscriptionsUrl);
}


// ============================================================
// UI Cleanup
// ============================================================

/**
 * Moves the playlist ui to the bottom of the video. Runs every loaction change
 */
function movePlaylistLocation(root = document) {
  const videoEl = document.querySelector("ytd-watch-flexy");
  if (!videoEl) return;
  if (!videoEl.hasAttribute("playlist")) {
    const style = document.createElement("style");
    style.textContent = "#secondary { display: none !important; width: 0 !important; }";
    document.head.appendChild(style);

    return;
  };
  if (videoEl.hasAttribute("theater")) return;

  // Change layout to move playlist to bottom
  videoEl.removeAttribute("is-two-columns_");
  videoEl.setAttribute("is_single_column_", "");
  moved_playlist_location = true;
}


// ============================================================
// SPA Navigation Detection
// ============================================================

/**
 * Detect when YouTube changes pages internally
 * (pushState navigation).
 */
function runOnLocationChanged() {
  if (previousLocationHref === location.href) return;

  previousLocationHref = location.href;
  redirections();
  movePlaylistLocation();
}


/**
 * Hook into history navigation so redirects still trigger
 * when YouTube performs SPA page changes.
 */
function setupLocationChangeListeners() {
  const { pushState, replaceState } = history;

  history.pushState = function (...args) {
    const result = pushState.apply(this, args);
    runOnLocationChanged();
    return result;
  };

  history.replaceState = function (...args) {
    const result = replaceState.apply(this, args);
    runOnLocationChanged();
    return result;
  };

  window.addEventListener("popstate", runOnLocationChanged);
  window.addEventListener("hashchange", runOnLocationChanged);
}


// ============================================================
// Initialization
// ============================================================

/**
 * Main startup routine.
 */
function start() {
  redirections();
  redirectHomeLinks();
  movePlaylistLocation();

  setupLocationChangeListeners();

  // Intercept navigation clicks
  document.addEventListener("click", forceSubscriptionsNavigation, true);

  // Observe DOM changes (YouTube constantly mutates the page)
  observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      runOnLocationChanged();
      redirectHomeLinks();
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
}


// ============================================================
// Boot Logic
// ============================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
