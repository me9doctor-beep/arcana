import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";
import { RollText } from "@/components/ui/RollText";
import { EASE } from "@/lib/motion";
import { scrollToId } from "@/lib/lenis";
import { CHAPTERS, type ChapterId } from "@/lib/world";

interface HudProps {
  visible: boolean;
}

export function Hud({ visible }: HudProps) {
  const [active, setActive] = useState<ChapterId>("hero");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id as ChapterId);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    for (const c of CHAPTERS) {
      const el = document.getElementById(c.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  const index = Math.max(0, CHAPTERS.findIndex((c) => c.id === active));

  return (
    <>
      {/* top strip */}
      <motion.header
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-6 md:px-10"
        initial={{ opacity: 0, y: -8 }}
        animate={visible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <button
          type="button"
          onClick={() => scrollToId("hero")}
          className="pointer-events-auto group flex items-center gap-4"
          aria-label="Back to the threshold"
        >
          <svg width="14" height="14" viewBox="0 0 32 32" aria-hidden className="text-arc">
            <path d="M16 4 L28 27 H22.8 L16 14.4 L9.2 27 H4 Z" fill="currentColor" />
          </svg>
          <span className="mono-label text-[11px] tracking-[0.34em] text-fog">Arcana</span>
          <span className="mono-label hidden text-[10px] text-dust sm:inline">// World 01 · MediXO</span>
        </button>

        <div className="pointer-events-auto flex items-center gap-8">
          <span className="mono-label hidden items-center gap-3 text-[10px] text-ash md:flex" aria-live="polite">
            <span className="tnum">{String(index + 1).padStart(2, "0")}</span>
            <span className="h-px w-6 bg-white/15" />
            <span className="w-24 text-left">{CHAPTERS[index].label}</span>
          </span>
          <button
            type="button"
            onClick={() => scrollToId("enter")}
            className="group mono-label border-b border-arc/40 pb-1 text-[10px] text-arc transition-colors hover:border-arc"
          >
            <RollText text="Enter" />
          </button>
        </div>
      </motion.header>

      {/* chapter index */}
      <motion.nav
        aria-label="Chapters"
        className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 lg:block"
        initial={{ opacity: 0, x: 8 }}
        animate={visible ? { opacity: 1, x: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.2, ease: EASE }}
      >
        <ol className="flex flex-col items-end gap-3">
          {CHAPTERS.map((c, i) => {
            const isActive = c.id === active;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => scrollToId(c.id)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`Go to ${c.label}`}
                  className="group flex items-center gap-3 py-0.5"
                >
                  <span
                    className={cn(
                      "mono-label text-[9px] transition-all duration-500 ease-[var(--ease-cinematic)]",
                      isActive ? "translate-x-0 text-fog opacity-100" : "translate-x-2 text-ash opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100",
                    )}
                  >
                    {c.label}
                  </span>
                  <span
                    className={cn(
                      "block h-px transition-all duration-500 ease-[var(--ease-cinematic)]",
                      isActive ? "w-7 bg-arc" : "w-3 bg-white/25 group-hover:w-5 group-hover:bg-white/60",
                    )}
                  />
                  <span className="sr-only">{i + 1}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </motion.nav>
    </>
  );
}
