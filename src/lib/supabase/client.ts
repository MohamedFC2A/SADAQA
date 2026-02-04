"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = env.supabaseUrlOptional();
  const anon = env.supabaseAnonKeyOptional();
  if (!url || !anon) return null;
  return createBrowserClient(url, anon);
}

let cachedClientPromise:
  | Promise<SupabaseClient | null>
  | null = null;

export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  if (cachedClientPromise) return cachedClientPromise;

  cachedClientPromise = (async () => {
    const existing = createSupabaseBrowserClient();
    if (existing) return existing;

    const config = await getSupabasePublicConfig();
    if (!config.supabaseUrl || !config.supabaseAnonKey) return null;
    return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
  })();

  return cachedClientPromise;
}
