import Lenis from "lenis";

let instance: Lenis | null = null;

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Lazily create the single smooth-scroll driver. Returns null when reduced motion is preferred. */
export function getLenis(): Lenis | null {
  if (prefersReducedMotion()) return null;
  if (!instance) {
    instance = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      anchors: false,
    });
  }
  return instance;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else el.scrollIntoView({ behavior: "auto", block: "start" });
}

export function lockScroll(locked: boolean) {
  document.body.classList.toggle("intro-locked", locked);
  const lenis = getLenis();
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
