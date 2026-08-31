/**
 * The single focus overlay used by every blocked surface (Reddit home,
 * TikTok, GitHub explore, Snapchat consumer pages). Uniform design tokens
 * live in sites/shared/overlay.css which the build inlines per site.
 */
const OVERLAY_CLASS = "noalg-overlay";

export function createFocusOverlay(id: string): HTMLDivElement | null {
  const existing = document.getElementById(id);
  if (existing) return null;

  const overlay = document.createElement("div");
  overlay.id = id;
  overlay.className = OVERLAY_CLASS;

  const title = document.createElement("h1");
  title.textContent = "Time to Focus";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Read a book, learn something new, or build your dream project.";

  const sponsorLink = document.createElement("a");
  sponsorLink.className = "noalg-sponsor-link";
  sponsorLink.href = "https://github.com/sponsors/WarreTh";
  sponsorLink.target = "_blank";
  sponsorLink.rel = "noopener noreferrer";
  sponsorLink.textContent = "♥ Support No Algorithms";

  overlay.append(title, subtitle, sponsorLink);
  return overlay;
}

/** Convenience: create + append to body in one call. */
export function mountFocusOverlay(id: string): void {
  const overlay = createFocusOverlay(id);
  if (overlay) document.body.appendChild(overlay);
}
