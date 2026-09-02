import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { cn } from "@/utils/cn";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";

const EVENTS = [
  { time: "10:32", text: "Issue detected.", detail: "Payment gateway latency crossed 4.2s. NEX raised the alarm." },
  { time: "10:47", text: "Engineering responded.", detail: "Six members of the guild formed a strike party." },
  { time: "11:21", text: "QA validation completed.", detail: "Regression suite passed on the hotfix candidate." },
  { time: "11:35", text: "System restored.", detail: "Traffic re-routed. Zero data loss. The dragon fell." },
];

export function Chronicle() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 78%", "end 55%"] });
  const line = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="chronicle" aria-labelledby="chron-title" className="relative z-10 py-[18vh] md:py-[24vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow index="07" label="The chronicle" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 id="chron-title" className="display mt-10 text-[clamp(3.2rem,8.5vw,8.5rem)] text-fog">
                Nothing
                <br />
                <span className="font-serif font-normal normal-case italic tracking-[-0.02em]">disappears.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-[24rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
                Every milestone becomes part of the company's living history. Crises, launches, quiet victories — the
                world remembers who was there and what they did.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.2}>
              <div className="mono-label flex items-center justify-between border-b border-white/10 pb-4 text-[10px] text-ash">
                <span className="text-fog">The Arcana Chronicle</span>
                <span>Vol. III · Entry 412</span>
              </div>
            </Reveal>

            {/* faint previous entry */}
            <Reveal delay={0.3}>
              <div className="mt-8 flex items-baseline gap-6 opacity-35">
                <span className="mono-label w-28 shrink-0 text-[10px]">Aug 14 · 2026</span>
                <span className="display text-[1.2rem] text-mist">The Great Migration</span>
              </div>
            </Reveal>

            <div ref={ref} className="relative mt-10">
              <Reveal delay={0.1}>
                <p className="mono-label text-[10px] text-arc">Sept 01 · 2026</p>
                <h3 className="display mt-3 text-[clamp(2.2rem,4.5vw,3.8rem)] text-fog">The Payment Dragon</h3>
                <p className="mt-4 max-w-[26rem] font-serif text-[1.2rem] italic leading-snug text-mist md:text-[1.35rem]">
                  A critical production issue appeared.
                </p>
              </Reveal>

              <ol className="relative mt-10 ml-[3.3rem] border-l border-white/10 pl-8 md:ml-[3.8rem]" aria-label="Timeline">
                <motion.span
                  aria-hidden
                  className="absolute -left-px top-0 h-full w-px origin-top bg-arc"
                  style={{ scaleY: line }}
                />
                {EVENTS.map((e, i) => (
                  <Event key={e.time} e={e} i={i} progress={scrollYProgress} />
                ))}
              </ol>

              <Reveal delay={0.1}>
                <div className="mt-12 ml-[3.3rem] md:ml-[3.8rem]">
                  <div className="frame-corners inline-flex items-center gap-5 border border-arc/40 px-6 py-4">
                    <span className="h-1.5 w-1.5 rotate-45 bg-arc" aria-hidden />
                    <span className="mono-label text-[11px] tracking-[0.34em] text-arc">Mission complete.</span>
                  </div>
                  <dl className="mono-label mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[9px] text-ash">
                    <div className="flex gap-2"><dt>Duration</dt><dd className="text-mist">63 min</dd></div>
                    <div className="flex gap-2"><dt>Party</dt><dd className="text-mist">6 members</dd></div>
                    <div className="flex gap-2"><dt>XP awarded</dt><dd className="text-arc">+2,400</dd></div>
                    <div className="flex gap-2"><dt>World effect</dt><dd className="text-mist">Payment district fortified</dd></div>
                  </dl>
                </div>
              </Reveal>
            </div>

            {/* faint next entry */}
            <Reveal delay={0.2}>
              <div className="mt-14 flex items-baseline gap-6 opacity-35">
                <span className="mono-label w-28 shrink-0 text-[10px]">Sept 09 · 2026</span>
                <span className="display text-[1.2rem] text-mist">Launch of v4.1</span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Event({ e, i, progress }: { e: (typeof EVENTS)[number]; i: number; progress: MotionValue<number> }) {
  const at = (i + 0.5) / EVENTS.length;
  const opacity = useTransform(progress, [at - 0.16, at], [0.25, 1]);
  const dot = useTransform(progress, [at - 0.06, at], [0, 1]);
  const last = i === EVENTS.length - 1;
  return (
    <motion.li style={{ opacity }} className="relative pb-9 last:pb-0">
      <span className="mono-label absolute -left-[5.3rem] top-[0.2rem] w-10 text-right text-[10px] text-ash md:-left-[5.8rem]">
        {e.time}
      </span>
      <motion.span
        aria-hidden
        style={{ scale: dot }}
        className={cn(
          "absolute -left-8 top-[0.35rem] h-[7px] w-[7px] -translate-x-1/2 rounded-full",
          last ? "bg-arc" : "bg-fog",
        )}
      />
      <p className={cn("text-[1.1rem] md:text-[1.2rem]", last ? "text-arc" : "text-fog")}>{e.text}</p>
      <p className="mt-1 max-w-[24rem] text-[0.92rem] leading-relaxed text-ash">{e.detail}</p>
    </motion.li>
  );
}
