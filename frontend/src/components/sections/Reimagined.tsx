import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { ScrambleText } from "@/components/ui/ScrambleText";
import { MorphField } from "@/components/sections/MorphField";

const ROWS = [
  { from: "Tasks", to: "Quests" },
  { from: "Projects", to: "Worlds" },
  { from: "Teams", to: "Guilds" },
  { from: "Milestones", to: "Legends" },
  { from: "Progress", to: "A living world", serif: true },
];

export function Reimagined({ reduced }: { reduced: boolean }) {
  const stickyRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: stickyRef, offset: ["start start", "end end"] });
  const [reached, setReached] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const n = Math.min(ROWS.length, Math.floor((v - 0.08) / 0.16) + 1);
    if (n !== reached) setReached(Math.max(0, n));
  });

  const rowsOpacity = useTransform(scrollYProgress, [0, 0.06, 0.94, 1], [0, 1, 1, 0]);

  return (
    <section id="idea" aria-labelledby="idea-title" className="relative z-10">
      <div className="mx-auto max-w-[96rem] px-6 pt-[16vh] md:px-12 md:pt-[22vh]">
        <Reveal>
          <Eyebrow index="01" label="The idea" />
        </Reveal>
        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-7" delay={0.1}>
            <h2 id="idea-title" className="display text-[clamp(3.4rem,10.5vw,10.5rem)] text-fog">
              Work
              <br />
              <span className="font-serif font-normal normal-case italic tracking-[-0.02em] text-fog/90">
                Reimagined.
              </span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4 lg:col-start-9" delay={0.3}>
            <p className="max-w-[24rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
              ARCANA turns the invisible momentum of a company into something you can see, feel, and explore.
            </p>
          </Reveal>
        </div>
      </div>

      {/* transmutation */}
      <div ref={stickyRef} className="relative mt-[10vh] h-[260vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <MorphField progress={scrollYProgress} reduced={reduced} />
          <motion.div
            style={{ opacity: rowsOpacity }}
            className="absolute inset-0 flex items-start justify-center px-6 pt-[13vh] md:pt-[15vh]"
          >
            <ol className="w-full max-w-[72rem]" aria-label="What changes inside Arcana">
              {ROWS.map((row, i) => {
                const on = reached > i;
                return (
                  <li
                    key={row.from}
                    className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-white/[0.06] py-4 first:border-t md:gap-10 md:py-6"
                  >
                    <span
                      className={cn(
                        "display text-right text-[clamp(1.4rem,4vw,3.8rem)] font-light transition-colors duration-1000",
                        on ? "text-dust" : "text-mist",
                      )}
                    >
                      {row.from}
                    </span>
                    <span className="relative flex h-px w-10 items-center md:w-24" aria-hidden>
                      <span className="absolute inset-0 bg-white/10" />
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 origin-left bg-arc transition-transform duration-1000 ease-[var(--ease-cinematic)]",
                          on ? "scale-x-100" : "scale-x-0",
                        )}
                        style={{ width: "100%" }}
                      />
                      <span
                        className={cn(
                          "absolute -right-[3px] h-[7px] w-[7px] rotate-45 border-r border-t transition-colors duration-700",
                          on ? "border-arc" : "border-white/20",
                        )}
                      />
                    </span>
                    <span
                      className={cn(
                        "text-[clamp(1.4rem,4vw,3.8rem)] leading-none text-fog",
                        row.serif ? "font-serif italic tracking-[-0.01em]" : "display font-light",
                      )}
                    >
                      <ScrambleText text={row.serif ? row.to : row.to.toUpperCase()} active={on} />
                    </span>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
