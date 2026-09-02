import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE } from "@/lib/motion";

interface CountUpProps {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const fmt = (v: number, decimals: number) =>
  v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Animates a number into place when it enters the viewport — writes to the DOM directly, no re-renders. */
export function CountUp({
  value,
  duration = 2.2,
  delay = 0,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduced) {
      el.textContent = `${prefix}${fmt(value, decimals)}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (v) => {
        el.textContent = `${prefix}${fmt(v, decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, delay, decimals, prefix, suffix, reduced]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${fmt(value, decimals)}${suffix}`}>
      {prefix}
      {fmt(0, decimals)}
      {suffix}
    </span>
  );
}
