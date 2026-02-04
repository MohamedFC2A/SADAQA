import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-black/15 bg-white px-3 text-sm outline-none ring-0 placeholder:text-black/40 focus:border-pal-green dark:border-white/15 dark:bg-black dark:placeholder:text-white/40",
        className,
      )}
      {...props}
    />
  );
}

