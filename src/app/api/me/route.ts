import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_USER_ID } from "@/lib/auth/admin";
import { env } from "@/lib/env";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authed: false, isAdmin: false });
  }

  if (user.id === ADMIN_USER_ID) {
    return NextResponse.json({ authed: true, isAdmin: true });
  }

  const { data: profileAuthed, error: profileAuthedError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileAuthedError) {
    return NextResponse.json({
      authed: true,
      isAdmin: profileAuthed?.role === "admin",
    });
  }

  if (!env.supabaseServiceRoleKeyOptional()) {
    return NextResponse.json({ authed: true, isAdmin: false });
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    authed: true,
    isAdmin: profile?.role === "admin",
  });
}
