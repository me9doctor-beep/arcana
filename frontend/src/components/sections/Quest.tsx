import { motion, useInView, useMotionValue, useSpring } from "motion/react";
import { useRef, type PointerEvent } from "react";
import { cn } from "@/utils/cn";
import { CountUp } from "@/components/ui/CountUp";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { useFinePointer } from "@/hooks/usePointer";
import { EASE } from "@/lib/motion";

type ObjectiveState = "complete" | "active" | "queued" | "locked";
const OBJECTIVES: { name: string; state: ObjectiveState; meta: string }[] = [
  { name: "API Integration", state: "complete", meta: "Sealed · 14 / 14" },
  { name: "Interface System", state: "active", meta: "In motion · 09 / 11" },
  { name: "QA Validation", state: "queued", meta: "Awaiting · 00 / 06" },
  { name: "Production Launch", state: "locked", meta: "Locked" },
];

export function Quest({ reduced }: { reduced: boolean }) {
  return (
    <section id="quest" aria-labelledby="quest-title" className="relative z-10 py-[18vh] md:py-[24vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow index="03" label="The quest" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 id="quest-title" className="display mt-10 text-[clamp(3rem,7vw,7rem)] text-fog">
                Work with
                <br />
                <span className="font-serif font-normal normal-case italic tracking-[-0.02em]">a purpose.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.25}>
              <p className="mt-8 max-w-[24rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
                Every task has purpose. Every completed objective moves the world forward.
              </p>
              <p className="mt-4 max-w-[24rem] text-[0.95rem] leading-relaxed text-ash">
                Tickets become missions with stakes, chapters and rewards — while the underlying model stays exactly as
                rigorous as your sprint board demands.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7 lg:pl-8">
            <Reveal delay={0.15} y={40}>
              <MissionCard reduced={reduced} />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionCard({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const fine = useFinePointer();
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 20 });
  const sry = useSpring(ry, { stiffness: 120, damping: 20 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${(px * 100).toFixed(2)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(2)}%`);
    if (!fine || reduced) return;
    ry.set((px - 0.5) * 7);
    rx.set((0.5 - py) * 6);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const R = 54;
  const C = 2 * Math.PI * R;
  const pct = 82;

  return (
    <div style={{ perspective: 1400 }}>
      <motion.article
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={fine && !reduced ? { rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" } : undefined}
        className="frame-corners group relative border border-white/10 bg-[rgba(10,14,17,0.72)] p-7 backdrop-blur-md md:p-10"
        aria-label="Mission 027 — The Patient Portal"
      >
        {/* cursor sheen */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(520px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.05), transparent 45%)",
          }}
        />

        <header className="flex items-start justify-between gap-6">
          <div>
            <p className="mono-label text-[10px] text-arc">Mission 027</p>
            <h3 className="display mt-3 text-[clamp(1.9rem,3.6vw,3.2rem)] text-fog">The Patient Portal</h3>
          </div>
          <dl className="mono-label hidden text-right text-[10px] text-ash sm:block">
            <div className="flex justify-end gap-3">
              <dt>Sprint</dt>
              <dd className="text-mist">28</dd>
            </div>
            <div className="mt-1.5 flex justify-end gap-3">
              <dt>Guild</dt>
              <dd className="text-mist">Engineering</dd>
            </div>
            <div className="mt-1.5 flex justify-end gap-3">
              <dt>Priority</dt>
              <dd className="text-ember">Critical</dd>
            </div>
          </dl>
        </header>

        <div className="mt-9 grid gap-9 md:grid-cols-[auto_1fr] md:gap-12">
          {/* status ring */}
          <div className="flex items-center gap-6 md:block">
            <div className="relative h-[8.5rem] w-[8.5rem]">
              <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="64" cy="64" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
                <circle cx="64" cy="64" r={R - 8} stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" strokeDasharray="1 5" />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={R}
                  stroke="#37e5d8"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="butt"
                  strokeDasharray={C}
                  initial={{ strokeDashoffset: C }}
                  animate={inView ? { strokeDashoffset: C * (1 - pct / 100) } : {}}
                  transition={{ duration: 2.2, ease: EASE, delay: 0.3 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="mono-label text-[9px] text-ash">Status</span>
                <span className="tnum mt-1 text-[2rem] font-light leading-none text-fog">
                  {inView ? <CountUp value={pct} suffix="%" duration={2.2} delay={0.3} /> : "0%"}
                </span>
              </div>
            </div>
            <div className="md:mt-6">
              <p className="mono-label text-[9px] text-ash">XP available</p>
              <p className="tnum mt-1.5 text-[1.6rem] font-light leading-none text-arc">
                {inView ? <CountUp value={1240} prefix="+" duration={2} delay={0.6} /> : "+0"}
              </p>
            </div>
          </div>

          {/* objectives */}
          <div>
            <p className="mono-label text-[10px] text-ash">Objectives</p>
            <ol className="mt-4 divide-y divide-white/[0.06] border-y border-white/[0.06]">
              {OBJECTIVES.map((o, i) => (
                <motion.li
                  key={o.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.9, delay: 0.5 + i * 0.12, ease: EASE }}
                  className={cn(
                    "flex items-center justify-between gap-4 py-3.5",
                    o.state === "locked" && "opacity-45",
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Glyph state={o.state} />
                    <span
                      className={cn(
                        "text-[1rem] md:text-[1.05rem]",
                        o.state === "active" ? "text-fog" : o.state === "complete" ? "text-mist" : "text-ash",
                      )}
                    >
                      {o.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "mono-label text-[9px]",
                      o.state === "active" ? "text-arc" : o.state === "complete" ? "text-vital/80" : "text-dust",
                    )}
                  >
                    {o.meta}
                  </span>
                </motion.li>
              ))}
            </ol>
            <div className="mt-5 flex items-center justify-between">
              <span className="mono-label text-[9px] text-dust">Current objective</span>
              <span className="mono-label text-[9px] text-mist">Interface System · Day 06</span>
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}

function Glyph({ state }: { state: ObjectiveState }) {
  return (
    <span className="relative flex h-3.5 w-3.5 items-center justify-center" aria-hidden>
      {state === "complete" && (
        <>
          <span className="absolute inset-0 rounded-full border border-vital/70" />
          <span className="h-1.5 w-1.5 rounded-full bg-vital" />
        </>
      )}
      {state === "active" && (
        <>
          <span className="absolute inset-0 rounded-full border border-arc" />
          <span className="absolute -inset-1 rounded-full border border-arc/30 motion-safe:animate-breathe" />
          <span className="h-1.5 w-1.5 rounded-full bg-arc" />
        </>
      )}
      {state === "queued" && <span className="absolute inset-0 rounded-full border border-white/35" />}
      {state === "locked" && <span className="absolute inset-0 rounded-full border border-dashed border-white/30" />}
    </span>
  );
}
