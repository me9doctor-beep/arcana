import { motion, useAnimationFrame, useMotionValue, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { smoothPointer, useFinePointer } from "@/hooks/usePointer";
import { clamp } from "@/lib/random";
import { EASE } from "@/lib/motion";
import { HERO_TRAVEL, HORIZON, LANDMARKS, type Landmark } from "@/lib/world";
import { scrollToId } from "@/lib/lenis";

interface HeroProps {
  /** true when the intro should be collapsed (reduced motion or skipped) */
  fast: boolean;
  reduced: boolean;
}

const WORD = "ARCANA".split("");

export function Hero({ fast, reduced }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const fine = useFinePointer();

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const hudOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  const d = (base: number) => (fast ? Math.min(base * 0.12, 0.5) : base);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Arcana — the world behind the work"
      className="relative"
      style={{ height: `${100 + HERO_TRAVEL * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* ── Typography ─────────────────────────────────────── */}
        <motion.div
          style={reduced ? { opacity: contentOpacity } : { opacity: contentOpacity, scale: contentScale, y: contentY }}
          className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-transform"
        >
          <motion.p
            className="mono-label mb-8 text-[10px] text-ash md:mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, delay: d(3.4), ease: EASE }}
          >
            First deployment · MediXO
          </motion.p>

          <motion.h1
            className="display -mt-[0.1em] flex text-[clamp(3.6rem,15vw,13.5rem)] font-extralight leading-none text-fog"
            initial={{ letterSpacing: "0.42em" }}
            animate={{ letterSpacing: "0.16em" }}
            transition={{ duration: 2.6, delay: d(2.3), ease: EASE }}
            style={{ marginLeft: "0.16em" }}
            aria-label="ARCANA"
          >
            {WORD.map((ch, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="inline-block bg-gradient-to-b from-fog via-fog to-fog/55 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 22, filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 1.6, delay: d(2.4) + i * (fast ? 0.04 : 0.09), ease: EASE }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>

          <motion.h2
            className="mono-label mt-7 text-[clamp(10px,1.05vw,13px)] tracking-[0.46em] text-arc md:mt-9"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: d(3.15), ease: EASE }}
          >
            The world behind the work.
          </motion.h2>

          <motion.p
            className="mt-8 max-w-[26rem] font-serif text-[clamp(1.15rem,1.7vw,1.5rem)] italic leading-snug text-mist md:mt-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: d(3.55), ease: EASE }}
          >
            Where projects become journeys, teams become guilds, and progress leaves a mark on the world.
          </motion.p>

          <motion.div
            className="mt-12 flex flex-col items-center gap-5 sm:flex-row sm:gap-8 md:mt-14"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.3, delay: d(3.95), ease: EASE }}
          >
            <MagneticButton onClick={() => scrollToId("enter")} ariaLabel="Enter Arcana">
              Enter Arcana
            </MagneticButton>
            <MagneticButton variant="ghost" onClick={() => scrollToId("idea")} ariaLabel="Explore the world">
              Explore the world
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* ── Hotspots ───────────────────────────────────────── */}
        {fine && (
          <motion.div style={{ opacity: hudOpacity }} className="absolute inset-0 hidden md:block">
            {LANDMARKS.map((L, i) => (
              <Hotspot key={L.id} landmark={L} delay={d(4.3) + i * 0.15} reduced={reduced} />
            ))}
          </motion.div>
        )}

        {/* ── Corner readouts ────────────────────────────────── */}
        <motion.div
          style={{ opacity: hudOpacity }}
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between px-6 pb-7 md:px-10 md:pb-9"
        >
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: d(4.4), ease: EASE }}
          >
            <span className="relative block h-12 w-px overflow-hidden bg-white/10">
              <span className="absolute inset-0 origin-top bg-arc motion-safe:animate-descend" />
            </span>
            <span className="mono-label text-[10px] text-ash">Scroll to descend</span>
          </motion.div>

          <motion.dl
            className="mono-label hidden text-right text-[10px] text-ash md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: d(4.5), ease: EASE }}
          >
            <div className="flex justify-end gap-4">
              <dt>Members online</dt>
              <dd className="tnum text-mist">148</dd>
            </div>
            <div className="mt-1.5 flex justify-end gap-4">
              <dt>Missions in motion</dt>
              <dd className="tnum text-mist">027</dd>
            </div>
            <div className="mt-1.5 flex justify-end gap-4">
              <dt>World state</dt>
              <dd className="flex items-center gap-2 text-vital">
                <span className="h-1 w-1 rounded-full bg-vital motion-safe:animate-beacon" />
                Stable
              </dd>
            </div>
          </motion.dl>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Hotspot: a light on a structure that reveals a glimpse of the product ─── */
function Hotspot({ landmark, delay, reduced }: { landmark: Landmark; delay: number; reduced: boolean }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Mirror the canvas camera exactly: pan with the smoothed pointer, dolly around the horizon on scroll.
  useAnimationFrame(() => {
    if (reduced) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const heroP = clamp(window.scrollY / (H * HERO_TRAVEL));
    const zoom = 1 + heroP * 0.42;
    const X = landmark.x * W;
    const Y = landmark.y * H;
    const cx = W / 2;
    const horizon = H * HORIZON;
    const px = smoothPointer.nx;
    const py = smoothPointer.ny;
    x.set((X - cx + px * 22) * zoom - (X - cx));
    y.set((Y - horizon + py * 7) * zoom - (Y - horizon));
  });

  return (
    <motion.div
      className="absolute"
      style={{ left: `${landmark.x * 100}%`, top: `${landmark.y * 100}%`, x, y }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay, ease: EASE }}
    >
      <button
        type="button"
        className="group relative -translate-x-1/2 -translate-y-1/2 p-3"
        aria-label={`${landmark.label} — ${landmark.meta}`}
      >
        <span className="relative block h-[7px] w-[7px]">
          <span className="absolute inset-0 rounded-full bg-arc" />
          <span className="absolute -inset-[7px] rounded-full border border-arc/40 transition-transform duration-700 ease-[var(--ease-cinematic)] group-hover:scale-125 motion-safe:animate-beacon" />
        </span>
        {/* leader + label */}
        <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 flex -translate-x-1/2 flex-col items-center opacity-0 transition-opacity duration-500 ease-[var(--ease-cinematic)] group-hover:opacity-100 group-focus-visible:opacity-100">
          <span className="frame-corners whitespace-nowrap border border-white/10 bg-void/80 px-4 py-3 text-left backdrop-blur-sm">
            <span className="mono-label block text-[10px] text-fog">{landmark.label}</span>
            <span className="mono-label mt-1.5 block text-[10px] text-arc">{landmark.meta}</span>
          </span>
          <span className="block h-7 w-px bg-gradient-to-b from-white/30 to-arc/60" />
        </span>
      </button>
    </motion.div>
  );
}
