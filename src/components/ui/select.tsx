import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none focus:border-pal-green dark:border-white/15 dark:bg-black",
        className,
      )}
      {...props}
    />
  );
}

