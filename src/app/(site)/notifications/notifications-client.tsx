"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  createdAt: string;
  scope: "global" | "user";
  isRead: boolean;
  readAt: string | null;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; items: NotificationItem[] }
  | { kind: "error"; message: string };

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
}

export function NotificationsClient() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  async function load() {
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok || !data || typeof data !== "object") {
        setState({
          kind: "error",
          message: "تعذر تحميل الإشعارات حالياً.",
        });
        return;
      }
      const raw = (data as any).items;
      const items = Array.isArray(raw) ? (raw as NotificationItem[]) : [];
      setState({ kind: "ready", items });
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const unreadCount = useMemo(() => {
    if (state.kind !== "ready") return 0;
    return state.items.filter((x) => !x.isRead).length;
  }, [state]);

  async function markRead(id: string) {
    if (busyId || busyAll) return;
    setBusyId(id);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } finally {
      setBusyId(null);
      await load();
    }
  }

  async function markAllRead() {
    if (busyAll || busyId) return;
    setBusyAll(true);
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
    } finally {
      setBusyAll(false);
      await load();
    }
  }

  if (state.kind === "loading") {
    return <div className="text-sm text-muted-foreground">جارٍ التحميل...</div>;
  }

  if (state.kind === "error") {
    return (
      <div className="space-y-3">
        <div className="text-sm text-pal-red">{state.message}</div>
        <Button variant="secondary" onClick={load}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">كل الإشعارات</div>
          {unreadCount > 0 ? (
            <Badge tone="warning">غير مقروء: {unreadCount}</Badge>
          ) : (
            <Badge tone="neutral">لا يوجد جديد</Badge>
          )}
        </div>
        <Button variant="secondary" onClick={markAllRead} disabled={busyAll || unreadCount === 0}>
          {busyAll ? "جارٍ التحديث..." : "تعليم الكل كمقروء"}
        </Button>
      </div>

      {state.items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface-2 p-4 text-sm text-muted-foreground">
          لا توجد إشعارات حتى الآن.
        </div>
      ) : (
        <div className="space-y-3">
          {state.items.map((n) => (
            <div
              key={n.id}
              className={cn(
                "rounded-2xl border border-border bg-surface-2 p-4 transition-shadow",
                !n.isRead && "border-pal-gold/40 shadow-sm",
              )}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold">{n.title}</div>
                    {!n.isRead ? (
                      <Badge tone="warning">جديد</Badge>
                    ) : (
                      <Badge tone="neutral">مقروء</Badge>
                    )}
                    <Badge tone="neutral">{n.scope === "global" ? "عام" : "خاص"}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-7">
                    {n.body}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(n.createdAt)}
                    {n.readAt ? ` • قُرئ: ${formatDate(n.readAt)}` : ""}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {n.linkUrl ? (
                    <Link
                      href={n.linkUrl}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold hover:bg-surface-3"
                    >
                      فتح
                    </Link>
                  ) : null}
                  {!n.isRead ? (
                    <Button
                      variant="secondary"
                      onClick={() => markRead(n.id)}
                      disabled={busyId === n.id || busyAll}
                    >
                      {busyId === n.id ? "..." : "تعليم كمقروء"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

