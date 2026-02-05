import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-pal-red text-white hover:bg-pal-red/90 border border-transparent",
  secondary:
    "bg-white/55 text-foreground border border-black/15 hover:bg-white/70 backdrop-blur-xl dark:border-white/15 dark:bg-white/5 dark:hover:bg-white/10",
  ghost:
    "bg-transparent text-foreground border border-transparent hover:bg-black/5 dark:hover:bg-white/10",
};

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
};

export function ButtonLink({
  className,
  variant = "primary",
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pal-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
