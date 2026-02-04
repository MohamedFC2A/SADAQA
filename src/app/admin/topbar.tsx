"use client";

import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminTopbar() {
  async function logout() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="border-b border-black/10 bg-white dark:border-white/10 dark:bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-black/70 dark:text-white/70">
            ALZAKA
          </Link>
          <span className="text-sm font-semibold">لوحة الأدمن</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/requests"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
          >
            الطلبات
          </Link>
          <Button variant="secondary" onClick={logout}>
            تسجيل خروج
          </Button>
        </div>
      </div>
    </header>
  );
}
