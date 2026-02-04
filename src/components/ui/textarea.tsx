import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-2 text-sm outline-none placeholder:text-black/40 focus:border-pal-green dark:border-white/15 dark:bg-black dark:placeholder:text-white/40",
        className,
      )}
      {...props}
    />
  );
}

