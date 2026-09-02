import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { useFinePointer } from "@/hooks/usePointer";
import { EASE } from "@/lib/motion";

interface MagneticButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
  size?: "md" | "lg";
  className?: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
  arrow?: boolean;
}

const spring = { stiffness: 170, damping: 19, mass: 0.35 };

/**
 * The ARCANA threshold button. Magnetic on fine pointers, with corner brackets
 * that open and (for primary) a light that rises through the frame — a portal, not a pill.
 */
export function MagneticButton({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
  href,
  ariaLabel,
  arrow = true,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, spring);
  const sy = useSpring(y, spring);
  const lx = useTransform(sx, (v) => v * 0.45);
  const ly = useTransform(sy, (v) => v * 0.45);

  const onMove = (e: PointerEvent) => {
    if (!fine || reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * 0.24);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const primary = variant === "primary";

  const base = cn(
    "group relative inline-flex select-none items-center justify-center overflow-visible font-mono uppercase tracking-[0.28em] transition-colors duration-500",
    size === "md" ? "px-9 py-[1.1rem] text-[11px]" : "px-12 py-6 text-[12px]",
    primary ? "text-arc hover:text-void" : "text-mist hover:text-fog",
    className,
  );

  const inner = (
    <>
      {/* frame */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 border transition-colors duration-500",
          primary ? "border-arc/50 group-hover:border-arc" : "border-white/15 group-hover:border-white/40",
        )}
      />
      {/* rising light */}
      {primary && (
        <motion.span
          aria-hidden
          className="absolute inset-0 origin-bottom bg-arc"
          variants={{ rest: { scaleY: 0 }, hover: { scaleY: 1 } }}
          transition={{ duration: 0.55, ease: EASE }}
        />
      )}
      {/* ambient portal ring */}
      {primary && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-[7px] border border-arc/15 motion-safe:animate-breathe"
        />
      )}
      {/* corner brackets */}
      {(
        [
          ["-top-[5px] -left-[5px]", "border-t border-l", -1, -1],
          ["-top-[5px] -right-[5px]", "border-t border-r", 1, -1],
          ["-bottom-[5px] -left-[5px]", "border-b border-l", -1, 1],
          ["-bottom-[5px] -right-[5px]", "border-b border-r", 1, 1],
        ] as const
      ).map(([pos, borders, dx, dy]) => (
        <motion.span
          key={pos}
          aria-hidden
          className={cn(
            "absolute h-[9px] w-[9px]",
            pos,
            borders,
            primary ? "border-arc/70" : "border-white/35 group-hover:border-white/70",
          )}
          variants={{ rest: { x: 0, y: 0 }, hover: { x: dx * 4, y: dy * 4 } }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      ))}
      {/* label */}
      <motion.span className="relative z-10 flex items-center gap-4" style={{ x: lx, y: ly }}>
        <span>{children}</span>
        {arrow && (
          <svg
            width="26"
            height="8"
            viewBox="0 0 26 8"
            fill="none"
            aria-hidden
            className="overflow-visible"
          >
            <motion.line
              x1="0"
              y1="4"
              x2="22"
              y2="4"
              stroke="currentColor"
              strokeWidth="1"
              variants={{ rest: { x2: 22 }, hover: { x2: 30 } }}
              transition={{ duration: 0.5, ease: EASE }}
            />
            <motion.path
              d="M18 0.5 L22 4 L18 7.5"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              variants={{ rest: { x: 0 }, hover: { x: 8 } }}
              transition={{ duration: 0.5, ease: EASE }}
            />
          </svg>
        )}
      </motion.span>
    </>
  );

  const motionProps = {
    initial: "rest" as const,
    animate: "rest" as const,
    whileHover: "hover" as const,
    whileFocus: "hover" as const,
    whileTap: { scale: 0.985 },
    style: { x: sx, y: sy },
    onPointerMove: onMove,
    onPointerLeave: onLeave,
    className: base,
    "aria-label": ariaLabel,
  };

  if (href) {
    return (
      <motion.a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} onClick={onClick} {...motionProps}>
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button ref={ref as React.RefObject<HTMLButtonElement>} type="button" onClick={onClick} {...motionProps}>
      {inner}
    </motion.button>
  );
}
