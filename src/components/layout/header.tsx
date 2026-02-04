"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

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

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthed(Boolean(data.session));
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-pal-red text-white">
            AZ
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">ALZAKA</span>
            <span className="text-xs text-black/60 dark:text-white/60">
              منصة الزكاة والتبرعات
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
          <ButtonLink
            href="/admin/requests"
            variant="ghost"
            className="hidden sm:inline-flex"
          >
            لوحة الأدمن
          </ButtonLink>
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
