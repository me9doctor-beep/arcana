import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  duration?: number;
  className?: string;
  once?: boolean;
  amount?: number | "some" | "all";
}

/** Scroll-triggered entrance: rises out of soft blur, never bounces. */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  blur = true,
  duration = 1.3,
  className,
  once = true,
  amount,
}: RevealProps) {
  const reduced = useReducedMotion();
  const hidden = reduced
    ? { opacity: 0 }
    : { opacity: 0, y, ...(blur ? { filter: "blur(10px)" } : {}) };
  const visible = reduced
    ? { opacity: 1 }
    : { opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) };

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={visible}
      viewport={{ once, margin: "-8% 0px -8% 0px", amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
