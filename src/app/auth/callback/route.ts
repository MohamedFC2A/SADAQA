import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export const runtime = "nodejs";

function safeNext(nextRaw: string | null) {
  const next = typeof nextRaw === "string" ? nextRaw : "";
  return next.startsWith("/") ? next : "/profile";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url));
  }

  const { supabase, applyCookies } = createSupabaseRouteHandlerClient(request);
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  const error = (exchanged as { error?: unknown }).error as unknown;
  const data = (exchanged as { data?: unknown }).data as
    | { session?: { user?: { id?: string } } | null; user?: { id?: string } | null }
    | undefined;

  const session = data?.session ?? null;
  const user = data?.user ?? session?.user ?? null;

  if (error || !user || !session) {
    const res = NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url));
    applyCookies(res);
    return res;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name,phone")
    .eq("id", user.id)
    .maybeSingle();

  const name = typeof profile?.name === "string" ? profile.name.trim() : "";
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";

  if (name.length < 2 || phone.length < 8) {
    const res = NextResponse.redirect(
      new URL(`/onboarding?next=${encodeURIComponent(next)}`, url),
    );
    applyCookies(res);
    return res;
  }

  const res = NextResponse.redirect(new URL(next, url));
  applyCookies(res);
  return res;
}
