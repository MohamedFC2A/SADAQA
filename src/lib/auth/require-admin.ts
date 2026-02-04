import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ADMIN_USER_ID } from "@/lib/auth/admin";
import { env } from "@/lib/env";

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin/requests");
  }

  if (user.id === ADMIN_USER_ID) {
    return { user, isAdmin: true as const };
  }

  // Prefer checking via the user's session (RLS), and fall back to service role
  // if the DB isn't migrated yet.
  const { data: profileAuthed, error: profileAuthedError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileAuthedError) {
    return { user, isAdmin: profileAuthed?.role === "admin" };
  }

  if (!env.supabaseServiceRoleKeyOptional()) {
    return { user, isAdmin: false as const };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { user, isAdmin: !error && profile?.role === "admin" };
}
