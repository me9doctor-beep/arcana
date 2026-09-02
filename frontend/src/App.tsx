import { MotionConfig, animate, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { CursorLight } from "@/components/CursorLight";
import { Hero } from "@/components/Hero";
import { Hud } from "@/components/Hud";
import { Chronicle } from "@/components/sections/Chronicle";
import { Enter } from "@/components/sections/Enter";
import { Evolves } from "@/components/sections/Evolves";
import { Guild } from "@/components/sections/Guild";
import { Intelligence } from "@/components/sections/Intelligence";
import { Progression } from "@/components/sections/Progression";
import { Proof } from "@/components/sections/Proof";
import { Quest } from "@/components/sections/Quest";
import { Reimagined } from "@/components/sections/Reimagined";
import { World } from "@/components/sections/World";
import { usePointerListener, usePrefersReducedMotion } from "@/hooks/usePointer";
import { getLenis, lockScroll } from "@/lib/lenis";
import { EASE } from "@/lib/motion";

const INTRO_DURATION = 3.9; // seconds the world takes to assemble
const INTRO_TOTAL = 4800; // ms before scroll is released

export default function App() {
  usePointerListener();
  const reduced = usePrefersReducedMotion();
  const assembly = useMotionValue(0);
  const [introDone, setIntroDone] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    getLenis();
  }, []);

  // ── The arrival sequence ──────────────────────────────────────────────
  useEffect(() => {
    if (reduced) {
      assembly.set(1);
      setIntroDone(true);
      return;
    }
    window.scrollTo(0, 0);
    lockScroll(true);
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      lockScroll(false);
      setIntroDone(true);
    };
    const controls = animate(assembly, 1, { duration: INTRO_DURATION, delay: 0.45, ease: [0.5, 0, 0.12, 1] });
    const timer = window.setTimeout(finish, INTRO_TOTAL);
    const skip = () => {
      if (finished) return;
      controls.stop();
      window.clearTimeout(timer);
      setSkipped(true);
      animate(assembly, 1, { duration: 0.9, ease: EASE });
      finish();
    };
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("wheel", skip, opts);
    window.addEventListener("touchstart", skip, opts);
    return () => {
      controls.stop();
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      if (!finished) lockScroll(false);
    };
  }, [reduced, assembly]);

  const fast = reduced || skipped;

  return (
    <MotionConfig reducedMotion="user">
      <a
        href="#idea"
        className="mono-label sr-only z-[70] bg-void px-4 py-3 text-arc focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Atmosphere assembly={assembly} reduced={reduced} />
      <CursorLight />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-[60] opacity-[0.05]" />

      <Hud visible={introDone} />

      <main className="relative">
        <Hero key={fast ? "fast" : "cinematic"} fast={fast} reduced={reduced} />
        <Reimagined reduced={reduced} />
        <Thread />
        <World reduced={reduced} />
        <Thread />
        <Quest reduced={reduced} />
        <Thread />
        <Guild />
        <Thread />
        <Intelligence />
        <Thread />
        <Progression />
        <Thread />
        <Chronicle />
        <Thread />
        <Evolves />
        <Thread />
        <Proof />
        <Enter />
      </main>
    </MotionConfig>
  );
}

/** A thin thread of light that ties one chapter to the next. */
function Thread() {
  return (
    <div aria-hidden className="relative z-10 mx-auto h-[10vh] w-px bg-gradient-to-b from-transparent via-white/[0.14] to-transparent" />
  );
}
