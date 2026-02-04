import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ADMIN_USER_ID } from "@/lib/auth/admin";
import { env } from "@/lib/env";

export async function requireAdminApi() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const };
  if (user.id === ADMIN_USER_ID) return { ok: true as const, userId: user.id };

  // Prefer checking via the user's session (RLS), and fall back to service role
  // if the DB isn't migrated yet.
  const { data: profileAuthed, error: profileAuthedError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profileAuthedError) {
    return { ok: profileAuthed?.role === "admin", userId: user.id };
  }

  if (env.supabaseServiceRoleKeyOptional()) {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return { ok: profile?.role === "admin", userId: user.id };
  }

  return { ok: false as const, userId: user.id };
}
