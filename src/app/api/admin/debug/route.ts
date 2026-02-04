import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

export async function GET() {
  const adminCheck = await requireAdminApi();
  if (!adminCheck.ok) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const admin = createSupabaseAdminClient();

  const checks: Record<string, { ok: boolean; message?: string | null }> = {};

  const c1 = await admin.from("requests").select("id").limit(1);
  checks["requests_table"] = {
    ok: !c1.error,
    message: c1.error?.message ?? null,
  };

  const c2 = await admin.from("donation_campaigns").select("id").limit(1);
  checks["campaigns_table"] = {
    ok: !c2.error,
    message: c2.error?.message ?? null,
  };

  const c3 = await admin
    .from("donation_campaigns")
    .select("id,image_url,goal_amount")
    .limit(1);
  checks["campaigns_columns"] = {
    ok: !c3.error,
    message: c3.error?.message ?? null,
  };

  const c4 = await admin.from("donations").select("id").limit(1);
  checks["donations_table"] = {
    ok: !c4.error,
    message: c4.error?.message ?? null,
  };

  return NextResponse.json({
    supabaseUrl,
    hasServiceRole,
    checks,
  });
}

