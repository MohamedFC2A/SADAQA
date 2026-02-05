import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md dark:border-white/10 dark:bg-black/45",
        className,
      )}
      {...props}
    />
  );
}
