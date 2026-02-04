import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  const url = env.supabaseUrlOptional();
  const anon = env.supabaseAnonKeyOptional();
  if (!url || !anon) return null;

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
