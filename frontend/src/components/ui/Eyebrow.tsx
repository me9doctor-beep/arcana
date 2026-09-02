import { cn } from "@/utils/cn";

interface EyebrowProps {
  index: string;
  label: string;
  className?: string;
  align?: "left" | "center";
}

export function Eyebrow({ index, label, className, align = "left" }: EyebrowProps) {
  return (
    <div
      className={cn(
        "mono-label flex items-center gap-4 text-ash",
        align === "center" && "justify-center",
        className,
      )}
    >
      <span className="tnum text-arc/80">{index}</span>
      <span className="h-px w-8 bg-white/15" aria-hidden />
      <span>{label}</span>
    </div>
  );
}
