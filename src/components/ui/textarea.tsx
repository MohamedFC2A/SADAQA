import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none placeholder:text-black/40 transition-colors focus:border-pal-green focus-visible:ring-2 focus-visible:ring-pal-green/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:border-white/15 dark:bg-black dark:placeholder:text-white/40",
        className,
      )}
      {...props}
    />
  );
}
