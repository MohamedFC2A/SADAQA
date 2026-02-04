"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseBrowserClient() {
  const url = env.supabaseUrlOptional();
  const anon = env.supabaseAnonKeyOptional();
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}
