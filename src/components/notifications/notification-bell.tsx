"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

type LatestUnread = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const pathname = usePathname();
  const router = useRouter();
  const [count, setCount] = useState<number>(0);
  const [toast, setToast] = useState<LatestUnread | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [busyRead, setBusyRead] = useState(false);

  const shouldToast = useMemo(() => pathname !== "/notifications", [pathname]);

  async function refreshCount() {
    const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json().catch(() => null)) as unknown;
    const next =
      data && typeof data === "object" && typeof (data as any).count === "number"
        ? (data as any).count
        : Number((data as any)?.count ?? 0) || 0;
    setCount(next);
    return next;
  }

  async function maybeShowToast(nextCount?: number) {
    const c = typeof nextCount === "number" ? nextCount : count;
    if (!shouldToast || c <= 0) return;
    const res = await fetch("/api/notifications/latest-unread", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json().catch(() => null)) as any;
    const item = data?.item;
    if (!item || typeof item !== "object") return;
    if (typeof item.id !== "string" || item.id.length < 10) return;
    setToast({
      id: item.id,
      title: typeof item.title === "string" ? item.title : "إشعار جديد",
      body: typeof item.body === "string" ? item.body : "",
      linkUrl: typeof item.linkUrl === "string" ? item.linkUrl : null,
      createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
    });
    setToastOpen(true);
  }

  useEffect(() => {
    let active = true;
    let timer: number | null = null;

    async function tick() {
      try {
        const nextCount = await refreshCount();
        if (!active) return;
        await maybeShowToast(nextCount);
      } catch {
        // ignore polling errors
      } finally {
        if (!active) return;
        timer = window.setTimeout(tick, 120_000);
      }
    }

    void tick();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldToast]);

  async function markToastRead() {
    if (!toast || busyRead) return;
    setBusyRead(true);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: toast.id }),
      });
      setToastOpen(false);
      setToast(null);
      await refreshCount();
    } finally {
      setBusyRead(false);
    }
  }

  return (
    <>
      <Link
        href="/notifications"
        className={cn(
          "relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface/80 text-foreground backdrop-blur transition-colors hover:bg-surface-2",
        )}
        aria-label="الإشعارات"
        onClick={() => {
          setToastOpen(false);
          setToast(null);
        }}
      >
        <Bell size={18} />
        {count > 0 ? (
          <span className="absolute -top-1 -left-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-pal-red px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>

      <AnimatePresence>
        {toastOpen && toast ? (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed right-4 top-24 z-50 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl"
          >
            <div className="border-b border-border bg-surface-2 px-4 py-3">
              <div className="text-sm font-semibold">إشعار جديد</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                لديك إشعار غير مقروء. سيظهر تذكير كل دقيقتين حتى تقرأه.
              </div>
            </div>
            <div className="space-y-2 px-4 py-4">
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.body ? (
                <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-7">
                  {toast.body.length > 180 ? `${toast.body.slice(0, 180)}…` : toast.body}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setToastOpen(false);
                    setToast(null);
                    router.push("/notifications");
                    router.refresh();
                  }}
                >
                  عرض الإشعارات
                </Button>
                <Button variant="secondary" onClick={markToastRead} disabled={busyRead}>
                  {busyRead ? "..." : "تعليم كمقروء"}
                </Button>
                {toast.linkUrl ? (
                  <Link
                    href={toast.linkUrl}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-pal-green px-5 text-sm font-semibold text-white hover:bg-pal-green/90"
                    onClick={() => {
                      setToastOpen(false);
                      setToast(null);
                    }}
                  >
                    فتح
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-muted-foreground hover:bg-surface-2"
                  onClick={() => setToastOpen(false)}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

