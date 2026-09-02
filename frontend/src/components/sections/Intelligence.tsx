import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { EASE } from "@/lib/motion";

const INSIGHT = "Sprint 28 is showing early signs of delivery risk.";

export function Intelligence() {
  const panelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(panelRef, { once: true, margin: "-20% 0px" });

  return (
    <section id="intelligence" aria-labelledby="nex-title" className="relative z-10 py-[18vh] md:py-[24vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <div className="grid items-center gap-16 lg:grid-cols-12 lg:gap-6">
          {/* entity */}
          <div className="order-2 lg:order-1 lg:col-span-5">
            <Reveal blur={false} y={0}>
              <Nex />
            </Reveal>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
            <Reveal>
              <Eyebrow index="05" label="The intelligence · NEX" />
            </Reveal>
            <Reveal delay={0.1}>
              <h2 id="nex-title" className="display mt-10 text-[clamp(3rem,7vw,7rem)] text-fog">
                Your work
                <br />
                has an
                <br />
                <span className="font-serif font-normal normal-case italic tracking-[-0.02em] text-arc">intelligence.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-[26rem] text-[1.05rem] leading-relaxed text-mist md:text-[1.15rem]">
                NEX is not a chatbot. It is a layer woven through ARCANA that watches the shape of your sprints, learns
                how your guilds actually move, and speaks only when it matters.
              </p>
            </Reveal>

            <Reveal delay={0.3} y={30}>
              <div ref={panelRef} className="mt-12 max-w-[34rem] border-t border-white/10">
                <div className="flex items-center justify-between py-4">
                  <span className="mono-label flex items-center gap-3 text-[10px] text-ash">
                    <span className="h-1.5 w-1.5 rounded-full bg-arc motion-safe:animate-beacon" />
                    NEX · Observation 0417
                  </span>
                  <span className="mono-label text-[10px] text-dust">Sprint 28 · Day 06</span>
                </div>

                <blockquote className="border-l border-arc/50 py-1 pl-6">
                  <p className="font-serif text-[1.45rem] italic leading-snug text-fog md:text-[1.75rem]">
                    <TypeText text={INSIGHT} active={inView} />
                  </p>
                </blockquote>

                <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-7 border-t border-white/[0.06] pt-7">
                  <div>
                    <dt className="mono-label text-[9px] text-ash">Risk detected</dt>
                    <dd className="mt-2 flex items-center gap-3 text-[1.1rem] text-fog">
                      <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden />
                      Payment API
                    </dd>
                  </div>
                  <div>
                    <dt className="mono-label text-[9px] text-ash">Probability</dt>
                    <dd className="mt-2">
                      <span className="tnum text-[1.1rem] text-fog">
                        <CountUp value={72} suffix="%" delay={1.6} duration={1.6} />
                      </span>
                      <span className="mt-2.5 block h-px w-full bg-white/10">
                        <motion.span
                          className="block h-full bg-ember"
                          initial={{ scaleX: 0, originX: 0 }}
                          animate={inView ? { scaleX: 0.72 } : {}}
                          transition={{ duration: 1.6, delay: 1.6, ease: EASE }}
                        />
                      </span>
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="mono-label text-[9px] text-ash">Recommendation</dt>
                    <dd className="mt-2 max-w-[26rem] text-[1rem] leading-relaxed text-mist">
                      Resolve the blocker before beginning analytics integration. Two members from the Portal mission
                      are available on day 07.
                    </dd>
                  </div>
                </dl>

                <div className="mt-8">
                  <MagneticButton variant="ghost" ariaLabel="View insight from NEX">
                    View insight
                  </MagneticButton>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── The entity ──────────────────────────────────────────────────────────── */
function Nex() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[30rem]">
      {/* the one intentional glow */}
      <div
        aria-hidden
        className="absolute inset-[18%] rounded-full motion-safe:animate-breathe"
        style={{ background: "radial-gradient(circle, rgba(55,229,216,0.22) 0%, rgba(55,229,216,0.05) 40%, rgba(55,229,216,0) 70%)" }}
      />
      <svg viewBox="0 0 400 400" className="relative h-full w-full overflow-visible" role="img" aria-label="NEX — the Arcana intelligence">
        <defs>
          <radialGradient id="nex-core" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#e9eeee" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#37e5d8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#37e5d8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* outer index ring */}
        <g className="motion-safe:animate-spin-slower" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="186" stroke="rgba(255,255,255,0.08)" fill="none" />
          <circle cx="200" cy="200" r="186" stroke="rgba(255,255,255,0.22)" strokeDasharray="1 11" fill="none" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * 180}
                y1={200 + Math.sin(a) * 180}
                x2={200 + Math.cos(a) * 192}
                y2={200 + Math.sin(a) * 192}
                stroke="rgba(255,255,255,0.3)"
              />
            );
          })}
        </g>

        {/* segmented ring */}
        <g className="motion-safe:animate-spin-reverse" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="150" stroke="rgba(55,229,216,0.45)" strokeWidth="1" strokeDasharray="110 60 30 100 60 120" fill="none" />
        </g>

        {/* orbit */}
        <g className="motion-safe:animate-orbit" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="112" stroke="rgba(255,255,255,0.05)" fill="none" />
          <circle cx="312" cy="200" r="2.5" fill="#37e5d8" />
          <circle cx="200" cy="88" r="1.5" fill="#e9eeee" opacity="0.7" />
        </g>
        <g className="motion-safe:animate-spin-slow" style={{ transformOrigin: "200px 200px" }}>
          <circle cx="200" cy="200" r="80" stroke="rgba(255,255,255,0.12)" strokeDasharray="6 10" fill="none" />
        </g>

        {/* geometric core */}
        <g className="motion-safe:animate-spin-slow" style={{ transformOrigin: "200px 200px" }}>
          <polygon points="200,150 243,175 243,225 200,250 157,225 157,175" stroke="rgba(233,238,238,0.35)" fill="none" />
        </g>
        <g className="motion-safe:animate-spin-reverse" style={{ transformOrigin: "200px 200px" }}>
          <polygon points="200,164 231,182 231,218 200,236 169,218 169,182" stroke="rgba(55,229,216,0.6)" fill="rgba(55,229,216,0.04)" />
        </g>
        <circle cx="200" cy="200" r="30" fill="url(#nex-core)" className="motion-safe:animate-breathe" style={{ transformOrigin: "200px 200px" }} />
        <circle cx="200" cy="200" r="5" fill="#e9eeee" />

        {/* readouts */}
        <text x="24" y="392" fill="#6b7578" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="2.4">
          NEX · V0.9 · LISTENING
        </text>
        <text x="376" y="392" textAnchor="end" fill="#6b7578" fontFamily="var(--font-mono)" fontSize="9" letterSpacing="2.4">
          148 SIGNALS
        </text>
      </svg>
    </div>
  );
}

/* ─── Calm typewriter ─────────────────────────────────────────────────────── */
function TypeText({ text, active }: { text: string; active: boolean }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? text.length : 0);

  useEffect(() => {
    if (!active || reduced) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setN(i);
      if (i >= text.length) window.clearInterval(id);
    }, 34);
    return () => window.clearInterval(id);
  }, [active, text, reduced]);

  return (
    <span aria-label={text}>
      <span aria-hidden>{text.slice(0, n)}</span>
      <span
        aria-hidden
        className={n < text.length ? "ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-arc" : "hidden"}
      />
    </span>
  );
}
