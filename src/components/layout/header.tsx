"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const nav = [
  { href: "/", label: "الرئيسية" },
  { href: "/donate", label: "تبرع" },
  { href: "/request-help", label: "طلب مساعدة" },
  { href: "/profile", label: "حسابي" },
  { href: "/about", label: "من نحن" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | null = null;

    getSupabaseBrowserClient().then((supabase) => {
      if (!supabase) return;
      supabase.auth.getSession().then(({ data }) => {
        setIsAuthed(Boolean(data.session));
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthed(Boolean(session));
      });
      unsub = () => sub.subscription.unsubscribe();
    });

    return () => {
      unsub?.();
    };
  }, []);

  useEffect(() => {
    fetch("/api/me", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data || typeof data !== "object") return;
        const obj = data as Record<string, unknown>;
        setIsAdmin(obj["isAdmin"] === true);
      })
      .catch(() => {
        setIsAdmin(false);
      });
  }, [isAuthed]);

  async function handleLogout() {
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <div className="flex flex-col leading-tight">
            <span className="font-brand text-base font-bold tracking-wide">
              MADDAD
            </span>
            <span className="text-xs text-muted-foreground">
              منصة التبرعات وطلبات المساعدة
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground",
                pathname === item.href &&
                "bg-surface-2 text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface/80 text-foreground backdrop-blur transition-colors hover:bg-surface-2 md:hidden"
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <ThemeToggle className="hidden sm:inline-flex" />
          {isAdmin ? (
            <ButtonLink
              href="/admin/requests"
              variant="ghost"
              className="hidden sm:inline-flex"
            >
              لوحة الأدمن
            </ButtonLink>
          ) : null}
          {isAuthed ? (
            <Button variant="secondary" onClick={handleLogout}>
              تسجيل خروج
            </Button>
          ) : (
            <ButtonLink href="/login" variant="secondary">
              تسجيل دخول
            </ButtonLink>
          )}
        </div>
      </div>

      {mobileOpen ? (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-border bg-surface p-3 shadow-lg">
            <div className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-xl px-4 py-3 text-sm font-semibold transition-colors hover:bg-surface-2",
                    pathname === item.href &&
                    "bg-surface-2 text-foreground",
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
              <ThemeToggle className="flex-1" />
              {isAdmin ? (
                <ButtonLink
                  href="/admin/requests"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setMobileOpen(false)}
                >
                  لوحة الأدمن
                </ButtonLink>
              ) : null}
              {isAuthed ? (
                <Button
                  variant="secondary"
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleLogout();
                  }}
                  className="flex-1"
                >
                  تسجيل خروج
                </Button>
              ) : (
                <ButtonLink
                  href="/login"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setMobileOpen(false)}
                >
                  تسجيل دخول
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
