"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem("theme", theme);
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = (localStorage.getItem("theme") as Theme | null) ?? null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return stored ?? (prefersDark ? "dark" : "light");
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggle() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "inline-flex h-11 w-11 items-center justify-center rounded-xl border border-black/10 bg-white/80 text-black/80 backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-black/40 dark:text-white/80 dark:hover:bg-black",
        className,
      )}
      aria-label={theme === "dark" ? "تبديل إلى الوضع الفاتح" : "تبديل إلى الوضع الداكن"}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
