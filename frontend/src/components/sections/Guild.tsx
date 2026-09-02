import { motion, useInView } from "motion/react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { CountUp } from "@/components/ui/CountUp";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/ui/Reveal";
import { createRng } from "@/lib/random";
import { EASE } from "@/lib/motion";

const NAMES = [
  "Aditya", "Mara", "Tobias", "Ines", "Kenji", "Leila", "Omar", "Priya", "Jonas",
  "Sofia", "Ravi", "Elin", "Dario", "Noor", "Felix", "Ayo", "Hana", "Milo",
];
const ROLES = ["Backend", "Frontend", "Platform", "Mobile", "Data", "Security", "Infra"];
const PROJECTS = [
  { id: "portal", label: "Patient Portal", angle: -90 },
  { id: "payment", label: "Payment API", angle: 30 },
  { id: "analytics", label: "Analytics", angle: 150 },
];

const SIZE = 640;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUT = 262;
const R_IN = 118;

const polar = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};

export function Guild() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const [hover, setHover] = useState<number | null>(null);

  const members = useMemo(() => {
    const rng = createRng(18);
    return NAMES.map((name, i) => {
      const angle = -90 + (i / NAMES.length) * 360;
      const links = [i % 3];
      if (rng.chance(0.45)) links.push((i + 1) % 3);
      return { name, role: ROLES[i % ROLES.length], angle, links, load: rng.range(0.35, 1), ...polar(R_OUT, angle) };
    });
  }, []);

  const projects = useMemo(() => PROJECTS.map((p) => ({ ...p, ...polar(R_IN, p.angle) })), []);

  return (
    <section id="guild" aria-labelledby="guild-title" className="relative z-10 py-[16vh] md:py-[22vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <Reveal>
          <Eyebrow index="04" label="The guild" />
        </Reveal>
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-7" delay={0.1}>
            <h2 id="guild-title" className="display text-[clamp(3rem,7.5vw,7.5rem)] text-fog">
              Great work
              <br />
              is rarely
              <br />
              <span className="font-serif font-normal normal-case italic tracking-[-0.02em]">a solo quest.</span>
            </h2>
          </Reveal>
          <Reveal className="self-end lg:col-span-4 lg:col-start-9" delay={0.3}>
            <p className="max-w-[24rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
              Teams form guilds. Guilds hold missions. And every connection between a person and a project is visible,
              measurable, and alive.
            </p>
          </Reveal>
        </div>

        <div ref={ref} className="mt-16 grid items-center gap-12 lg:mt-24 lg:grid-cols-12">
          {/* left stats */}
          <dl className="order-2 grid grid-cols-2 gap-8 lg:order-1 lg:col-span-3 lg:grid-cols-1 lg:gap-12">
            <Stat label="Active members" value={18} inView={inView} delay={0.2} />
            <Stat label="Sprint health" value={91} suffix="%" inView={inView} delay={0.35} tone="vital" />
          </dl>

          {/* formation */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <div className="relative mx-auto aspect-square w-full max-w-[40rem]">
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full overflow-visible" role="img" aria-label="Engineering guild formation: 18 members connected to three active projects">
                <defs>
                  <radialGradient id="guild-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#37e5d8" stopOpacity="0.14" />
                    <stop offset="100%" stopColor="#37e5d8" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* rings */}
                <circle cx={CX} cy={CY} r={R_OUT} stroke="rgba(255,255,255,0.08)" fill="none" />
                <g className="origin-center motion-safe:animate-spin-slower" style={{ transformOrigin: `${CX}px ${CY}px` }}>
                  <circle cx={CX} cy={CY} r={R_OUT + 22} stroke="rgba(255,255,255,0.06)" strokeDasharray="1 7" fill="none" />
                </g>
                <g className="origin-center motion-safe:animate-spin-reverse" style={{ transformOrigin: `${CX}px ${CY}px` }}>
                  <circle cx={CX} cy={CY} r={R_IN + 40} stroke="rgba(55,229,216,0.18)" strokeDasharray="40 200" fill="none" />
                </g>
                <circle cx={CX} cy={CY} r={R_IN} stroke="rgba(255,255,255,0.06)" fill="none" />
                <circle cx={CX} cy={CY} r={90} fill="url(#guild-core)" />

                {/* links */}
                {members.map((m, i) =>
                  m.links.map((li) => {
                    const p = projects[li];
                    const lit = hover === i;
                    const dim = hover !== null && !lit;
                    return (
                      <motion.line
                        key={`${i}-${li}`}
                        x1={m.x}
                        y1={m.y}
                        x2={p.x}
                        y2={p.y}
                        stroke={lit ? "#37e5d8" : "rgba(55,229,216,0.7)"}
                        strokeWidth={lit ? 1.2 : 0.6}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={inView ? { pathLength: 1, opacity: lit ? 1 : dim ? 0.06 : 0.22 } : {}}
                        transition={{
                          pathLength: { duration: 1.6, delay: 0.3 + i * 0.05, ease: EASE },
                          opacity: { duration: 0.5 },
                        }}
                      />
                    );
                  }),
                )}

                {/* projects */}
                {projects.map((p, i) => (
                  <motion.g
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ duration: 1, delay: 0.5 + i * 0.15 }}
                  >
                    <circle cx={p.x} cy={p.y} r="16" fill="#0a0e11" stroke="rgba(55,229,216,0.6)" />
                    <circle cx={p.x} cy={p.y} r="4" fill="#37e5d8" className="motion-safe:animate-beacon" style={{ animationDelay: `${i * 0.9}s` }} />
                    <text
                      x={p.x}
                      y={p.y + (p.angle < 0 ? -28 : 36)}
                      textAnchor="middle"
                      fill="#a6b0b3"
                      fontFamily="var(--font-mono)"
                      fontSize="10"
                      letterSpacing="2"
                    >
                      {p.label.toUpperCase()}
                    </text>
                  </motion.g>
                ))}

                {/* members */}
                {members.map((m, i) => {
                  const lit = hover === i;
                  return (
                    <motion.g
                      key={m.name}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: EASE }}
                      style={{ transformOrigin: `${m.x}px ${m.y}px` }}
                      onPointerEnter={() => setHover(i)}
                      onPointerLeave={() => setHover(null)}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover(null)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${m.name}, ${m.role}`}
                      className="cursor-pointer outline-none"
                    >
                      <circle cx={m.x} cy={m.y} r="22" fill="transparent" />
                      <circle
                        cx={m.x}
                        cy={m.y}
                        r={lit ? 14 : 11}
                        fill="#0a0e11"
                        stroke={lit ? "#37e5d8" : `rgba(233,238,238,${(0.25 + m.load * 0.5).toFixed(2)})`}
                        strokeWidth="1"
                        className="transition-all duration-500"
                      />
                      <text
                        x={m.x}
                        y={m.y + 3.5}
                        textAnchor="middle"
                        fill={lit ? "#37e5d8" : "#a6b0b3"}
                        fontFamily="var(--font-mono)"
                        fontSize="9"
                        letterSpacing="0.5"
                        className="pointer-events-none transition-colors duration-500"
                      >
                        {m.name.slice(0, 2).toUpperCase()}
                      </text>
                      {lit && (
                        <g className="pointer-events-none">
                          <rect
                            x={m.x - 54}
                            y={m.y + (m.angle > 0 && m.angle < 180 ? 22 : -50)}
                            width="108"
                            height="28"
                            fill="rgba(5,7,8,0.9)"
                            stroke="rgba(255,255,255,0.12)"
                          />
                          <text
                            x={m.x}
                            y={m.y + (m.angle > 0 && m.angle < 180 ? 40 : -32)}
                            textAnchor="middle"
                            fill="#e9eeee"
                            fontFamily="var(--font-mono)"
                            fontSize="9.5"
                            letterSpacing="1.6"
                          >
                            {m.name.toUpperCase()} · {m.role.toUpperCase()}
                          </text>
                        </g>
                      )}
                    </motion.g>
                  );
                })}
              </svg>

              {/* centre */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="mono-label text-[9px] text-ash">Engineering Guild</span>
                <span className="display mt-2 text-[clamp(1.6rem,2.6vw,2.4rem)] text-fog">Level 24</span>
              </div>
            </div>
          </div>

          {/* right stats */}
          <dl className="order-3 grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-1 lg:gap-12 lg:text-right">
            <Stat label="Team momentum" value={18} prefix="+" suffix="%" inView={inView} delay={0.5} tone="arc" />
            <Stat label="Missions held" value={12} inView={inView} delay={0.65} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  prefix,
  suffix,
  inView,
  delay,
  tone,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  inView: boolean;
  delay: number;
  tone?: "arc" | "vital";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      <dt className="mono-label text-[10px] text-ash">{label}</dt>
      <dd className={cn("tnum mt-2 text-[2.6rem] font-extralight leading-none md:text-[3.2rem]", tone === "arc" ? "text-arc" : tone === "vital" ? "text-vital" : "text-fog")}>
        <CountUp value={value} prefix={prefix} suffix={suffix} delay={delay} />
      </dd>
    </motion.div>
  );
}
