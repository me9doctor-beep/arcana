import { useAnimationFrame, useMotionValue, motion } from "motion/react";
import { pointer, useFinePointer } from "@/hooks/usePointer";

/** A faint, lagging light that follows the cursor — the world noticing you. */
export function CursorLight() {
  const fine = useFinePointer();
  const x = useMotionValue(-1000);
  const y = useMotionValue(-1000);
  const o = useMotionValue(0);

  useAnimationFrame(() => {
    if (!fine) return;
    const cx = x.get();
    const cy = y.get();
    x.set(cx + (pointer.x - cx) * 0.12);
    y.set(cy + (pointer.y - cy) * 0.12);
    o.set(o.get() + ((pointer.active ? 1 : 0) - o.get()) * 0.08);
  });

  if (!fine) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[5] h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
      style={{
        x,
        y,
        opacity: o,
        background:
          "radial-gradient(circle, rgba(55,229,216,0.075) 0%, rgba(55,229,216,0.03) 30%, rgba(55,229,216,0) 65%)",
      }}
    />
  );
}
