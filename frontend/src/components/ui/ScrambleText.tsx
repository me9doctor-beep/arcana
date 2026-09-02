import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const GLYPHS = "ARCNΔ◊⟁⌁∆⋄01▮▯/\\|─";

interface ScrambleTextProps {
  text: string;
  /** When this flips to true the decode runs. */
  active: boolean;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * Text "transmutation" — glyphs resolve left-to-right from noise into the target word.
 * Renders a stable-width string so layout never jumps.
 */
export function ScrambleText({ text, active, duration = 1100, delay = 0, className }: ScrambleTextProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (active || reduced ? text : " ".repeat(text.length)));
  const frame = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    if (reduced) {
      setDisplay(text);
      return;
    }
    let start: number | null = null;
    const thresholds = Array.from({ length: text.length }, (_, i) => (i / text.length) * 0.72 + Math.random() * 0.25);

    const tick = (now: number) => {
      if (start === null) start = now + delay;
      const t = Math.min(1, Math.max(0, (now - start) / duration));
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === " ") {
          out += " ";
          continue;
        }
        if (t >= thresholds[i]) out += ch;
        else if (t > thresholds[i] - 0.35) out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        else out += " ";
      }
      setDisplay(out);
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else setDisplay(text);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [active, text, duration, delay, reduced]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{display}</span>
    </span>
  );
}
