"use client";

import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AdminTopbar() {
  async function logout() {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <BrandMark className="h-9 w-9" />
            <span className="font-brand text-sm font-bold tracking-wide">
              MADDAD
            </span>
          </Link>
          <span className="text-sm font-semibold">لوحة الأدمن</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            الطلبات
          </Link>
          <Link
            href="/admin/donations"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            التبرعات
          </Link>
          <Link
            href="/admin/campaigns"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            الحملات
          </Link>
          <Link
            href="/admin/notifications"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            الإشعارات
          </Link>
          <Link
            href="/admin/debug"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            تشخيص
          </Link>
          <ThemeToggle />
          <Button variant="secondary" onClick={logout}>
            تسجيل خروج
          </Button>
        </div>
      </div>
    </header>
  );
}
