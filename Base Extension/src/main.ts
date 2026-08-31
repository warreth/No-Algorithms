// ============================================================
// No Algorithms — content-script bootstrap.
// Engine, timer and site rules are wired here and nothing else.
// ============================================================
import { Engine } from "./core/engine";
import { getActiveRules } from "./core/registry";
import { PageTimer } from "./core/timer";

const boot = () => {
  new Engine(location, getActiveRules(location.hostname)).start();
  new PageTimer().start();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
