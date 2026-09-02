import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";
import { RollText } from "@/components/ui/RollText";
import { scrollToId } from "@/lib/lenis";

const LINKS = [
  { label: "World", id: "world" },
  { label: "Quests", id: "quest" },
  { label: "Guilds", id: "guild" },
  { label: "Intelligence", id: "intelligence" },
  { label: "Chronicle", id: "chronicle" },
];

export function Enter() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const darkness = useTransform(scrollYProgress, [0, 0.6], [0, 1]);

  return (
    <>
      <section
        ref={ref}
        id="enter"
        aria-labelledby="enter-title"
        className="relative z-10 flex min-h-[110vh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      >
        {/* the world fades to black */}
        <motion.div
          aria-hidden
          style={{ opacity: darkness }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-void/80 to-black"
        />

        <div className="relative">
          <Reveal>
            <p className="mono-label text-[10px] text-ash">The threshold</p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 id="enter-title" className="display mt-10 text-[clamp(3.6rem,13vw,13rem)] text-fog">
              Ready
              <br />
              to enter?
            </h2>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-10 font-serif text-[1.25rem] italic text-mist md:text-[1.5rem]">The world is already moving.</p>
          </Reveal>
          <Reveal delay={0.4} className="mt-14 flex justify-center">
            <MagneticButton size="lg" onClick={() => scrollToId("hero")} ariaLabel="Enter Arcana">
              Enter Arcana
            </MagneticButton>
          </Reveal>
          <Reveal delay={0.55}>
            <p className="mono-label mt-12 text-[10px] text-ash">Built for teams who want more than another dashboard.</p>
          </Reveal>
        </div>
      </section>

      <footer className="relative z-10 bg-black px-6 pb-10 pt-24 md:px-12 md:pt-32">
        <div className="mx-auto max-w-[96rem]">
          <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-4">
                <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden className="text-arc">
                  <path d="M16 4 L28 27 H22.8 L16 14.4 L9.2 27 H4 Z" fill="currentColor" />
                </svg>
                <span className="mono-label text-[12px] tracking-[0.36em] text-fog">Arcana</span>
              </div>
              <p className="mono-label mt-4 text-[10px] text-ash">The world behind the work.</p>
            </div>
            <nav aria-label="Footer">
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {LINKS.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => scrollToId(l.id)}
                      className="group mono-label text-[10px] text-mist transition-colors hover:text-fog"
                    >
                      <RollText text={l.label} />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="mt-16 flex flex-col gap-3 border-t border-white/[0.07] pt-6 md:flex-row md:items-center md:justify-between">
            <p className="mono-label text-[9px] text-dust">© 2026 Arcana</p>
            <p className="mono-label text-[9px] text-dust">World 01 · Deployed for MediXO</p>
          </div>
        </div>
      </footer>
    </>
  );
}
