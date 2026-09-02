import { AnimatePresence, cubicBezier, motion, useMotionTemplate, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { useIsDesktop } from "@/hooks/usePointer";
import { EASE } from "@/lib/motion";
import { DISTRICTS, VB_H, VB_W, WorldMap, iso } from "@/components/sections/WorldMap";

const STOPS = DISTRICTS.length + 1; // overview + districts
const camEase = cubicBezier(0.65, 0, 0.35, 1);

export function World({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const desktop = useIsDesktop();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(-1);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(STOPS - 1, Math.floor((v + 0.045) * STOPS)) - 1;
    if (i !== active) setActive(i);
  });

  // Camera keyframes: hold on each stop, travel between them.
  const keys = useMemo(() => {
    const input: number[] = [];
    const scale: number[] = [];
    const tx: number[] = [];
    const ty: number[] = [];
    const zoom = desktop ? 2.15 : 1.9;
    const yOffset = desktop ? 3 : -6;
    for (let i = 0; i < STOPS; i++) {
      const a = i === 0 ? 0 : i / STOPS + 0.03;
      const b = i === STOPS - 1 ? 1 : (i + 1) / STOPS - 0.04;
      let s = 1;
      let x = desktop ? 11 : 0; // overview sits right of the readout on desktop
      let y = 0;
      if (i > 0) {
        const d = DISTRICTS[i - 1];
        const p = iso(d.gx + 0.5, d.gy + 0.5, d.hq ? 70 : 34);
        s = zoom;
        x = (0.5 - p.x / VB_W) * 100;
        y = (0.5 - p.y / VB_H) * 100 + yOffset;
      }
      input.push(a, b);
      scale.push(s, s);
      tx.push(x, x);
      ty.push(y, y);
    }
    return { input, scale, tx, ty };
  }, [desktop]);

  const scale = useTransform(scrollYProgress, keys.input, keys.scale, { ease: camEase });
  const tx = useTransform(scrollYProgress, keys.input, keys.tx, { ease: camEase });
  const ty = useTransform(scrollYProgress, keys.input, keys.ty, { ease: camEase });
  const transform = useMotionTemplate`scale(${scale}) translate(${tx}%, ${ty}%)`;
  const mapOpacity = useTransform(scrollYProgress, [0, 0.04, 0.97, 1], [0, 1, 1, 0]);

  const district = active >= 0 ? DISTRICTS[active] : null;

  return (
    <section id="world" aria-labelledby="world-title" className="relative z-10">
      <div className="mx-auto max-w-[96rem] px-6 pt-[20vh] md:px-12 md:pt-[26vh]">
        <Reveal>
          <Eyebrow index="02" label="The world" />
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-8" delay={0.1}>
            <h2 id="world-title" className="display text-[clamp(3.4rem,10.5vw,10.5rem)] text-fog">
              Your company.
              <br />
              <span className="font-serif font-normal normal-case italic tracking-[-0.02em] text-arc">Alive.</span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4" delay={0.3}>
            <p className="max-w-[24rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
              Every department is a district. Every project has an address. The company itself becomes the interface —
              and you move through it.
            </p>
          </Reveal>
        </div>
      </div>

      {/* camera travel */}
      <div ref={ref} className="relative mt-[8vh] h-[620vh]">
        <div className="sticky top-0 h-screen overflow-hidden">
          <motion.div style={{ opacity: mapOpacity }} className="absolute inset-0 flex items-center justify-center">
            <motion.div
              style={reduced ? undefined : { transform, transformOrigin: "50% 50%" }}
              className="relative aspect-[1400/900] w-[max(100vw,155.5vh)] shrink-0 will-change-transform"
            >
              <WorldMap active={active} className="h-full w-full" />
            </motion.div>
          </motion.div>

          {/* vignette so the frame edges dissolve */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(5,7,8,0) 40%, rgba(5,7,8,0.75) 100%), linear-gradient(to bottom, rgba(5,7,8,0.7), rgba(5,7,8,0) 22%, rgba(5,7,8,0) 78%, rgba(5,7,8,0.85))",
            }}
          />

          {/* district readout */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-8 md:px-12 md:pb-12 lg:inset-y-0 lg:right-auto lg:flex lg:w-[30rem] lg:items-center lg:pb-0">
            <div className="relative min-h-[11.5rem] w-full max-w-[26rem] lg:min-h-[22rem]">
              <AnimatePresence mode="wait">
                {district ? (
                  <motion.article
                    key={district.id}
                    initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                    transition={{ duration: 0.7, ease: EASE }}
                    className="pointer-events-auto border-l border-arc/40 pl-6 md:pl-8"
                    aria-live="polite"
                  >
                    <div className="mono-label flex items-center gap-3 text-[10px] text-ash">
                      <span className="text-arc">District {district.index}</span>
                      <span className="h-px w-4 bg-white/15" />
                      <span>{String(DISTRICTS.length).padStart(2, "0")}</span>
                    </div>
                    <h3 className="display mt-3 text-[clamp(2rem,4vw,3.4rem)] text-fog">{district.name}</h3>
                    <p className="mt-3 max-w-[22rem] font-serif text-[1.1rem] italic leading-snug text-mist md:text-[1.25rem]">
                      {district.desc}
                    </p>
                    <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-white/10 pt-4 md:mt-7 md:pt-5">
                      {district.stats.map(([k, v]) => (
                        <div key={k}>
                          <dt className="mono-label text-[9px] text-ash">{k}</dt>
                          <dd className="tnum mt-1.5 text-[1rem] font-light text-fog md:text-[1.15rem]">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </motion.article>
                ) : (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="border-l border-white/15 pl-6 md:pl-8"
                  >
                    <p className="mono-label text-[10px] text-ash">Overview · MediXO World 01</p>
                    <p className="mt-3 max-w-[20rem] font-serif text-[1.15rem] italic leading-snug text-mist">
                      Six districts. One living map of everything the company is doing right now.
                    </p>
                    <p className="mono-label mt-5 text-[10px] text-dust">Keep scrolling to travel</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* route ticks */}
          <ol
            className="absolute bottom-8 right-6 hidden items-center gap-2 md:flex lg:bottom-12 lg:right-16"
            aria-label="District route"
          >
            {DISTRICTS.map((d, i) => (
              <li
                key={d.id}
                className={cn(
                  "h-px transition-all duration-700 ease-[var(--ease-cinematic)]",
                  i === active ? "w-8 bg-arc" : i < active ? "w-4 bg-white/40" : "w-4 bg-white/12",
                )}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
