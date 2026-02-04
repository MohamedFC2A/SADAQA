import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "danger" | "warning";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-black/5 text-black/80 dark:bg-white/10 dark:text-white/80",
  success: "bg-pal-green/10 text-pal-green dark:bg-pal-green/20",
  danger: "bg-pal-red/10 text-pal-red dark:bg-pal-red/20",
  warning: "bg-pal-gold/15 text-pal-gold dark:bg-pal-gold/20",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}

