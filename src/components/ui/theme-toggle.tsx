"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

function toggle() {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  if (isDark) {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface/80 text-foreground backdrop-blur transition hover:bg-surface-2",
        className,
      )}
      aria-label="تبديل المظهر"
    >
      <Sun className="hidden size-[18px] dark:block" />
      <Moon className="block size-[18px] dark:hidden" />
    </button>
  );
}
