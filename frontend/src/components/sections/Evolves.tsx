import { animate, motion, useInView, useMotionTemplate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { createRng } from "@/lib/random";
import { EASE } from "@/lib/motion";

const CAUSES = [
  { cause: "Project completed", effect: "the environment grows." },
  { cause: "Sprint completed", effect: "a new area unlocks." },
  { cause: "Major release", effect: "the city celebrates." },
  { cause: "Company milestone", effect: "the world transforms." },
];

const W = 1200;
const H = 520;
const GROUND = 410;

type Building = { x: number; w: number; h: number; grow: number; windows: [number, number, number][]; beacon: boolean };

function buildSkyline(): Building[] {
  const rng = createRng(4242);
  const out: Building[] = [];
  let x = -10;
  while (x < W + 10) {
    const w = rng.range(14, 44);
    const c = Math.abs(x + w / 2 - W / 2) / (W / 2);
    const h = rng.range(30, 90) + (1 - c * c) * rng.range(40, 170);
    const grow = rng.chance(0.55) ? rng.range(20, 110) : 0;
    const windows: [number, number, number][] = [];
    const cols = Math.floor(w / 7);
    const rows = Math.floor((h + grow) / 9);
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) if (rng.chance(0.42)) windows.push([x + 3 + i * 7, GROUND - 6 - j * 9, rng.range(0.3, 1)]);
    out.push({ x, w, h, grow, windows, beacon: rng.chance(0.18) });
    x += w + rng.range(2, 9);
  }
  return out;
}

export function Evolves() {
  return (
    <section id="evolves" aria-labelledby="evo-title" className="relative z-10 py-[18vh] md:py-[24vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <Reveal>
          <Eyebrow index="08" label="The world evolves" />
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-7" delay={0.1}>
            <h2 id="evo-title" className="display text-[clamp(3rem,7.5vw,7.5rem)] text-fog">
              Build the work.
              <br />
              <span className="font-serif font-normal normal-case italic tracking-[-0.02em] text-arc">Change the world.</span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4 lg:col-start-9" delay={0.3}>
            <ol className="divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {CAUSES.map((c) => (
                <li key={c.cause} className="flex items-baseline justify-between gap-6 py-3.5">
                  <span className="mono-label text-[10px] text-mist">{c.cause}</span>
                  <span className="font-serif text-[1.1rem] italic text-fog">→ {c.effect}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>

        <Reveal className="mt-16 lg:mt-24" delay={0.1} y={40}>
          <Comparison />
        </Reveal>
      </div>
    </section>
  );
}

function Comparison() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduced = useReducedMotion();
  const x = useMotionValue(reduced ? 62 : 8);
  const [value, setValue] = useState(reduced ? 62 : 8);
  const dragging = useRef(false);
  const clipPath = useMotionTemplate`inset(0 calc(100% - ${x}%) 0 0)`;
  const left = useMotionTemplate`${x}%`;

  const buildings = useMemo(buildSkyline, []);

  useEffect(() => {
    if (!inView || reduced) return;
    const c = animate(x, 62, { duration: 2.6, delay: 0.4, ease: EASE, onUpdate: (v) => setValue(Math.round(v)) });
    return () => c.stop();
  }, [inView, reduced, x]);

  const setFromPointer = (e: PointerEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const v = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    x.set(v);
    setValue(Math.round(v));
  };
  const onDown = (e: PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setFromPointer(e);
  };
  const onMove = (e: PointerEvent) => dragging.current && setFromPointer(e);
  const onUp = () => (dragging.current = false);
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 4;
    let v = x.get();
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") v -= step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") v += step;
    else if (e.key === "Home") v = 0;
    else if (e.key === "End") v = 100;
    else return;
    e.preventDefault();
    v = Math.min(100, Math.max(0, v));
    animate(x, v, { duration: 0.4, ease: EASE, onUpdate: (n) => setValue(Math.round(n)) });
  };

  return (
    <div
      ref={ref}
      className="relative aspect-[1200/520] w-full cursor-ew-resize select-none overflow-hidden border border-white/10 bg-void touch-pan-y"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {/* BEFORE */}
      <Skyline buildings={buildings} mode="before" />
      {/* AFTER */}
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        <Skyline buildings={buildings} mode="after" />
      </motion.div>

      {/* labels */}
      <span className="mono-label pointer-events-none absolute left-5 top-5 text-[10px] text-ash">Before · Sprint 01</span>
      <span className="mono-label pointer-events-none absolute right-5 top-5 text-[10px] text-arc">After · Sprint 28</span>

      {/* handle */}
      <motion.div
        className="absolute inset-y-0 w-px bg-arc/80"
        style={{ left }}
        role="slider"
        aria-label="Reveal the evolved world"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={onKey}
      >
        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-arc/60 bg-void/80 backdrop-blur-sm">
          <svg width="16" height="8" viewBox="0 0 16 8" fill="none" stroke="#37e5d8" strokeWidth="1" aria-hidden>
            <path d="M4 1 L1 4 L4 7 M12 1 L15 4 L12 7 M1 4 H15" />
          </svg>
        </span>
      </motion.div>
    </div>
  );
}

function Skyline({ buildings, mode }: { buildings: Building[]; mode: "before" | "after" }) {
  const after = mode === "after";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`evo-h-${mode}`} cx="50%" cy="80%" r="60%">
          <stop offset="0%" stopColor="#37e5d8" stopOpacity={after ? 0.2 : 0.03} />
          <stop offset="100%" stopColor="#37e5d8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`evo-fog-${mode}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050708" stopOpacity="0" />
          <stop offset="100%" stopColor="#050708" stopOpacity="1" />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={after ? "#070b0d" : "#050708"} />
      <rect width={W} height={H} fill={`url(#evo-h-${mode})`} />
      {after &&
        Array.from({ length: 40 }).map((_, i) => (
          <circle key={i} cx={(i * 173) % W} cy={((i * 97) % (GROUND - 120)) + 10} r={i % 5 === 0 ? 1.2 : 0.7} fill="#e9eeee" opacity={0.25 + (i % 3) * 0.15} />
        ))}
      {/* streams */}
      {after && (
        <g stroke="#37e5d8" fill="none" strokeWidth="1" strokeDasharray="2 10" className="motion-safe:animate-dash" opacity="0.5">
          <path d={`M-20 ${GROUND - 200} Q ${W / 2} ${GROUND - 380} ${W + 20} ${GROUND - 170}`} />
          <path d={`M${W + 20} ${GROUND - 260} Q ${W * 0.4} ${GROUND - 120} -20 ${GROUND - 300}`} />
        </g>
      )}
      {/* buildings */}
      {buildings.map((b, i) => {
        const h = after ? b.h + b.grow : b.h;
        return (
          <g key={i}>
            <rect x={b.x} y={GROUND - h} width={b.w} height={h} fill={after ? "#0d161a" : "#0a0e11"} />
            <rect x={b.x} y={GROUND - h} width={b.w} height="1" fill={after ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.05)"} />
            {after &&
              b.windows.map(([wx, wy, o], k) => wy > GROUND - h + 4 ? <rect key={k} x={wx} y={wy} width="2" height="2" fill={o > 0.85 ? "#37e5d8" : "#cdece9"} opacity={o * 0.85} /> : null)}
            {after && b.beacon && (
              <>
                <line x1={b.x + b.w / 2} y1={GROUND - h} x2={b.x + b.w / 2} y2={GROUND - h - 22} stroke="rgba(255,255,255,0.3)" />
                <circle cx={b.x + b.w / 2} cy={GROUND - h - 23} r="2" fill="#37e5d8" className="motion-safe:animate-beacon" style={{ animationDelay: `${(i % 6) * 0.45}s` }} />
              </>
            )}
          </g>
        );
      })}
      {/* ground */}
      <rect x="0" y={GROUND} width={W} height="1" fill={after ? "rgba(55,229,216,0.7)" : "rgba(255,255,255,0.12)"} />
      <rect x="0" y={GROUND} width={W} height={H - GROUND} fill={`url(#evo-fog-${mode})`} />
      {!after && (
        <text x={W / 2} y={GROUND - 30} textAnchor="middle" fill="#3d4649" fontFamily="var(--font-mono)" fontSize="11" letterSpacing="3">
          NO ACTIVITY RECORDED
        </text>
      )}
    </svg>
  );
}
