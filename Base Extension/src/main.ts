// ============================================================
// No Algorithms — content-script bootstrap.
// Engine, timer and site rules are wired here and nothing else.
// ============================================================
import { Engine } from "./core/engine.ts";
import { getActiveRules } from "./core/registry.ts";
import { PageTimer } from "./core/timer.ts";

const boot = () => {
  new Engine(location, getActiveRules(location.hostname)).start();
  new PageTimer().start();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
