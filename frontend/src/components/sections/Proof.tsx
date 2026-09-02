import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";

const METRICS = [
  { value: 148, label: "Active members" },
  { value: 27, label: "Active missions" },
  { value: 94, suffix: "%", label: "Sprint health" },
  { value: 18420, label: "Quests completed" },
];

export function Proof() {
  return (
    <section aria-labelledby="proof-title" className="relative z-10 py-[18vh] md:py-[26vh]">
      <div className="mx-auto max-w-[96rem] px-6 md:px-12">
        <Reveal>
          <h2
            id="proof-title"
            className="mx-auto max-w-[62rem] text-center text-[clamp(1.9rem,4.6vw,4.4rem)] font-light leading-[1.12] tracking-[-0.02em] text-fog text-balance"
          >
            ARCANA isn't where work is tracked.
            <br />
            It's where work becomes{" "}
            <span className="font-serif italic text-arc">visible.</span>
          </h2>
        </Reveal>

        <Reveal delay={0.2} className="mt-20 md:mt-28">
          <dl className="grid grid-cols-2 gap-y-12 border-t border-white/10 pt-10 md:grid-cols-4 md:gap-y-0 md:pt-12">
            {METRICS.map((m, i) => (
              <div key={m.label} className="relative px-2 text-center md:px-6">
                {i > 0 && <span aria-hidden className="absolute left-0 top-1/2 hidden h-16 w-px -translate-y-1/2 bg-white/10 md:block" />}
                <dd className="tnum display text-[clamp(2.6rem,5.5vw,5.2rem)] text-fog">
                  <CountUp value={m.value} suffix={m.suffix} delay={0.2 + i * 0.12} duration={2.4} />
                </dd>
                <dt className="mono-label mt-4 text-[10px] text-ash">{m.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mono-label mt-8 text-center text-[9px] text-dust">Live from MediXO · World 01 · Sprint 28</p>
        </Reveal>
      </div>
    </section>
  );
}
