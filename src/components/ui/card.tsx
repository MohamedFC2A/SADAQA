import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-surface shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md",
        className,
      )}
      {...props}
    />
  );
}
