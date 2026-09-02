import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { cn } from "@/utils/cn";
import { CountUp } from "@/components/ui/CountUp";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { EASE } from "@/lib/motion";

const ATTRIBUTES = [
  { name: "Execution", value: 82 },
  { name: "Problem solving", value: 91 },
  { name: "Collaboration", value: 76 },
  { name: "Reliability", value: 88 },
];

const SEGMENTS = 10;

export function Progression() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <section id="progression" aria-labelledby="prog-title" className="relative z-10 py-[16vh] md:py-[22vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <Reveal>
          <Eyebrow index="06" label="The progression" />
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7" delay={0.1}>
            <h2 id="prog-title" className="display text-[clamp(3rem,7.5vw,7.5rem)] text-fog">
              Growth
              <br />
              <span className="font-serif font-normal normal-case italic tracking-[-0.02em]">made visible.</span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4 lg:col-start-9" delay={0.3}>
            <p className="max-w-[24rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
              Not badges. A character that evolves with the work you actually do — and abilities that unlock real
              responsibility inside the company.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="mt-16 grid gap-14 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          {/* character sheet */}
          <div className="lg:col-span-7">
            <div className="grid gap-10 border-t border-white/10 pt-10 md:grid-cols-[auto_1fr] md:gap-14">
              <div className="flex items-start gap-6 md:block">
                <Sigil inView={inView} />
                <div className="md:mt-6">
                  <p className="mono-label text-[10px] text-ash">Level</p>
                  <p className="tnum display mt-1 text-[4.2rem] text-fog md:text-[5.4rem]">
                    <CountUp value={24} duration={1.6} />
                  </p>
                  <p className="display mt-2 text-[1.4rem] text-fog">Aditya</p>
                  <p className="mono-label mt-1.5 text-[10px] text-arc">Engineering</p>
                </div>
              </div>

              <dl className="space-y-7 self-center">
                {ATTRIBUTES.map((a, i) => (
                  <div key={a.name}>
                    <div className="flex items-baseline justify-between">
                      <dt className="text-[0.95rem] text-mist">{a.name}</dt>
                      <dd className="tnum text-[0.95rem] text-fog">
                        <CountUp value={a.value} delay={0.3 + i * 0.12} duration={1.8} />
                      </dd>
                    </div>
                    <div className="mt-2.5 grid grid-cols-10 gap-[3px]" aria-hidden>
                      {Array.from({ length: SEGMENTS }).map((_, s) => {
                        const fill = Math.min(1, Math.max(0, a.value / (100 / SEGMENTS) - s));
                        return (
                          <span key={s} className="relative h-[3px] overflow-hidden bg-white/[0.07]">
                            <motion.span
                              className="absolute inset-y-0 left-0 bg-arc"
                              style={{ width: `${fill * 100}%` }}
                              initial={{ scaleX: 0, originX: 0 }}
                              animate={inView ? { scaleX: 1 } : {}}
                              transition={{ duration: 0.5, delay: 0.3 + i * 0.12 + s * 0.06, ease: EASE }}
                            />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </dl>
            </div>
            <p className="mono-label mt-6 text-[9px] text-dust">Attributes derived from 214 completed objectives · last 90 days</p>
          </div>

          {/* evolution */}
          <div className="lg:col-span-4 lg:col-start-9">
            <ol className="relative border-l border-white/10 pl-8">
              <motion.span
                aria-hidden
                className="absolute -left-px top-0 w-px origin-top bg-gradient-to-b from-white/30 via-arc to-arc"
                style={{ height: "100%" }}
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ duration: 2.2, delay: 0.6, ease: EASE }}
              />
              <Step inView={inView} delay={0.7} label="Current" title="Level 24" meta="12,860 XP" />
              <Step inView={inView} delay={1.3} label="Next" title="Level 25" meta="+380 XP to ascend" />
              <Step
                inView={inView}
                delay={1.9}
                highlight
                label="New ability unlocked"
                title="Sprint Architect"
                meta="Lead sprint planning ceremonies. Shape mission scope. Mentor two apprentices."
              />
            </ol>
            <Reveal delay={0.2}>
              <p className="mt-12 font-serif text-[1.35rem] italic leading-snug text-fog md:text-[1.6rem]">
                Your growth becomes visible.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Step({
  inView,
  delay,
  label,
  title,
  meta,
  highlight,
}: {
  inView: boolean;
  delay: number;
  label: string;
  title: string;
  meta: string;
  highlight?: boolean;
}) {
  return (
    <motion.li
      className="relative pb-12 last:pb-0"
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      <span
        aria-hidden
        className={cn(
          "absolute -left-8 top-[0.45rem] h-[9px] w-[9px] -translate-x-1/2 rotate-45 border",
          highlight ? "border-arc bg-arc" : "border-white/40 bg-void",
        )}
      />
      <p className={cn("mono-label text-[10px]", highlight ? "text-arc" : "text-ash")}>{label}</p>
      <p className={cn("display mt-2 text-[1.9rem]", highlight ? "text-fog" : "text-mist")}>{title}</p>
      <p className={cn("mt-2 max-w-[20rem] text-[0.95rem] leading-relaxed", highlight ? "text-mist" : "text-ash")}>{meta}</p>
    </motion.li>
  );
}

function Sigil({ inView }: { inView: boolean }) {
  return (
    <svg viewBox="0 0 96 96" className="h-24 w-24 shrink-0" role="img" aria-label="Identity sigil">
      <motion.polygon
        points="48,6 84,27 84,69 48,90 12,69 12,27"
        stroke="rgba(233,238,238,0.5)"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.8, ease: EASE }}
      />
      <motion.polygon
        points="48,22 70,35 70,61 48,74 26,61 26,35"
        stroke="rgba(55,229,216,0.7)"
        fill="rgba(55,229,216,0.04)"
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : {}}
        transition={{ duration: 1.6, delay: 0.3, ease: EASE }}
      />
      <motion.path
        d="M48 30 L60 66 H54 L48 48 L42 66 H36 Z"
        fill="#37e5d8"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 1, delay: 0.9 }}
      />
    </svg>
  );
}
