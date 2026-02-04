import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black",
        className,
      )}
      {...props}
    />
  );
}

