import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-pal-red text-white hover:bg-pal-red/90 border border-transparent",
  secondary:
    "bg-transparent text-foreground border border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10",
  ghost:
    "bg-transparent text-foreground border border-transparent hover:bg-black/5 dark:hover:bg-white/10",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
