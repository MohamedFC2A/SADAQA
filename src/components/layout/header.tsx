"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

const nav = [
  { href: "/", label: "الرئيسية" },
  { href: "/donate", label: "تبرع" },
  { href: "/request-help", label: "طلب مساعدة" },
  { href: "/about", label: "من نحن" },
  { href: "/contact", label: "تواصل" },
  { href: "/faq", label: "FAQ" },
] as const;

export function Header() {
  const pathname = usePathname();
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

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
    <header className="border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <BrandMark />
          <div className="flex flex-col leading-tight">
            <span className="font-brand text-base font-bold tracking-wide">
              SADAQA
            </span>
            <span className="text-xs text-black/60 dark:text-white/60">
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
                "rounded-lg px-3 py-2 text-sm font-semibold text-black/70 hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white",
                pathname === item.href &&
                  "bg-black/5 text-black dark:bg-white/10 dark:text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
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
    </header>
  );
}
