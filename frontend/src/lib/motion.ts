import type { Transition } from "motion/react";

/** Signature cinematic easing — long, decelerating, never bouncy. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const cinematic = (duration = 1.2, delay = 0): Transition => ({
  duration,
  delay,
  ease: EASE,
});

export const revealVariants = {
  hidden: { opacity: 0, y: 28, filter: "blur(10px)" },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.3, delay, ease: EASE },
  }),
};

export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

export const lineVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 1, ease: EASE } },
};
