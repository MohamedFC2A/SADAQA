import { cn } from "@/lib/cn";

export function PalestineLoading({
  className,
  size = 10,
  label = "جارٍ التحميل...",
}: {
  className?: string;
  size?: number;
  label?: string;
}) {
  const dotClass = "rounded-full";
  const dotStyle = { width: `${size}px`, height: `${size}px` } as const;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)} aria-live="polite">
      <div className="pal-dots inline-flex items-center gap-2" aria-hidden="true">
        <span className={cn(dotClass, "bg-pal-red")} style={dotStyle} />
        <span className={cn(dotClass, "bg-white")} style={dotStyle} />
        <span className={cn(dotClass, "bg-pal-green")} style={dotStyle} />
      </div>
      {label ? <div className="text-xs font-semibold text-muted-foreground">{label}</div> : null}
    </div>
  );
}

