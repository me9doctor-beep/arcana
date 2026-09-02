import { useEffect, useState } from "react";

/**
 * A single shared pointer store. Consumers read `pointer` inside rAF loops
 * (no React re-renders per mouse move).
 */
export const pointer = {
  x: 0, // px
  y: 0,
  nx: 0, // -1..1 normalized around viewport center
  ny: 0,
  active: false,
};

/** Smoothed (frame-lerped) pointer, written by the Atmosphere loop, read by DOM parallax. */
export const smoothPointer = { nx: 0, ny: 0 };

let listening = false;

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ny = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.active = true;
  };
  const onLeave = () => {
    pointer.active = false;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);
  document.addEventListener("mouseleave", onLeave);
}

export function usePointerListener() {
  useEffect(() => listen(), []);
}

export function useMediaQuery(query: string, fallback = false) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? fallback : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = () => setMatches(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

export const useFinePointer = () => useMediaQuery("(hover: hover) and (pointer: fine)");
export const usePrefersReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
