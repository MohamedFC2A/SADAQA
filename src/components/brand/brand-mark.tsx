import { cn } from "@/lib/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10",
        className,
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--pal-black)_0%,var(--pal-black)_33%,var(--pal-white)_33%,var(--pal-white)_66%,var(--pal-green)_66%,var(--pal-green)_100%)]" />
      <div
        className="absolute inset-y-0 left-0 w-2/3 bg-pal-red"
        style={{ clipPath: "polygon(0 0, 0 100%, 100% 50%)" }}
      />
      <div className="relative z-10 font-brand text-sm font-bold text-pal-black">
        S
      </div>
    </div>
  );
}

