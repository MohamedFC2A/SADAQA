import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-black/15 bg-white/65 px-3 text-sm outline-none placeholder:text-black/40 shadow-sm backdrop-blur-xl transition-colors focus:border-pal-green focus-visible:ring-2 focus-visible:ring-pal-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/15 dark:bg-black/40 dark:placeholder:text-white/40",
        className,
      )}
      {...props}
    />
  );
}
