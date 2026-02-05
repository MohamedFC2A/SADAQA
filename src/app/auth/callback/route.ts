import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/profile";

  if (!code) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url));
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.exchangeCodeForSession(code);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name,phone")
    .eq("id", user.id)
    .maybeSingle();

  const name = typeof profile?.name === "string" ? profile.name.trim() : "";
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";

  if (name.length < 2 || phone.length < 8) {
    return NextResponse.redirect(
      new URL(`/onboarding?next=${encodeURIComponent(next)}`, url),
    );
  }

  return NextResponse.redirect(new URL(next, url));
}
