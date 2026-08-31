/** Unobtrusive fixed page timer; persists its start across SPA reloads. */
const STORAGE_KEY = "noalg_timer_start";

export class PageTimer {
  private startTime: number;
  private el: HTMLElement | null = null;
  private intervalId: number | null = null;

  constructor() {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    this.startTime = saved ? parseInt(saved, 10) : Date.now();
    if (!saved) sessionStorage.setItem(STORAGE_KEY, String(this.startTime));
  }

  start(): void {
    if (this.el) return;
    this.el = document.createElement("div");
    this.el.id = "noalg-page-timer";
    this.el.title = "Time spent on this page";

    Object.assign(this.el.style, {
      position: "fixed",
      bottom: "15px",
      left: "15px",
      zIndex: "2147483647",
      pointerEvents: "none",
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      color: "rgba(255, 255, 255, 0.8)",
      padding: "4px 8px",
      borderRadius: "6px",
      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
      fontSize: "12px",
      fontWeight: "500",
      backdropFilter: "blur(4px)",
      transition: "opacity 0.3s ease, transform 0.5s ease",
      transformOrigin: "bottom left",
      opacity: "0.5"
    });

    document.body.appendChild(this.el);
    this.intervalId = window.setInterval(() => this.render(), 1000);
    this.render();
  }

  private render(): void {
    if (!this.el) return;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;

    this.el.textContent = h > 0
      ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${m}:${String(s).padStart(2, "0")}`;

    // Emphasize after 5 minutes; grow every 3 minutes.
    const long = elapsed > 300;
    this.el.style.opacity = long ? "0.8" : "0.5";
    this.el.style.backgroundColor = long ? "rgba(0, 0, 0, 0.6)" : "rgba(0, 0, 0, 0.4)";
    this.el.style.transform = `scale(${1 + 0.2 * Math.floor(elapsed / 180)})`;
  }

  reset(): void {
    this.startTime = Date.now();
    sessionStorage.setItem(STORAGE_KEY, String(this.startTime));
    this.render();
  }

  stop(): void {
    if (this.intervalId !== null) window.clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
