import { PalestineLoading } from "@/components/ui/palestine-loading";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-background/70 backdrop-blur-sm">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[61] h-1 overflow-hidden">
        <div className="h-full w-full bg-[linear-gradient(to_right,var(--pal-red),#ffffff,var(--pal-green))]" />
        <div className="progress-shimmer absolute inset-0" />
      </div>

      <div className="rounded-3xl border border-border bg-surface/90 px-8 py-6 shadow-xl">
        <PalestineLoading label="جاري تجهيز البيانات..." size={12} />
      </div>
    </div>
  );
}

