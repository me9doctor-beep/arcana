import { cn } from "@/utils/cn";

/** Hover roll: the label slides up and a duplicate rises in. Requires a `group` parent. */
export function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("relative inline-block overflow-hidden align-baseline", className)}>
      <span className="block transition-transform duration-500 ease-[var(--ease-cinematic)] group-hover:-translate-y-full group-focus-visible:-translate-y-full">
        {text}
      </span>
      <span
        aria-hidden
        className="absolute left-0 top-full block transition-transform duration-500 ease-[var(--ease-cinematic)] group-hover:-translate-y-full group-focus-visible:-translate-y-full"
      >
        {text}
      </span>
    </span>
  );
}
