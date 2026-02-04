import { requireAdmin } from "@/lib/auth/require-admin";
import { Card } from "@/components/ui/card";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminDebugPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING";
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const admin = createSupabaseAdminClient();
  const checks = {
    requests_table: await admin.from("requests").select("id").limit(1),
    campaigns_table: await admin.from("donation_campaigns").select("id").limit(1),
    campaigns_columns: await admin
      .from("donation_campaigns")
      .select("id,image_url,goal_amount")
      .limit(1),
    donations_table: await admin.from("donations").select("id").limit(1),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">تشخيص Supabase</h1>

      <Card className="p-6 space-y-2">
        <div className="text-sm font-semibold">إعدادات البيئة</div>
        <div className="text-sm text-black/70 dark:text-white/70">
          <div>
            <span className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</span>{" "}
            <span className="font-mono">{supabaseUrl}</span>
          </div>
          <div>
            <span className="font-semibold">SUPABASE_SERVICE_ROLE_KEY:</span>{" "}
            {hasServiceRole ? "OK" : "MISSING"}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-3">
        <div className="text-sm font-semibold">فحوصات</div>
        <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
          {Object.entries(checks).map(([name, result]) => (
            <li key={name} className="rounded-xl border border-black/10 p-3 dark:border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono">{name}</div>
                <div className={result.error ? "text-pal-red font-semibold" : "text-pal-green font-semibold"}>
                  {result.error ? "FAIL" : "OK"}
                </div>
              </div>
              {result.error ? (
                <div className="mt-2 text-xs">
                  <span className="font-semibold">message:</span>{" "}
                  <span className="font-mono">{result.error.message}</span>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="text-xs text-black/60 dark:text-white/60">
          إذا ظهر خطأ “relation does not exist” أو “column does not exist”، شغّل{" "}
          <span className="font-mono">supabase/schema.sql</span> داخل Supabase SQL Editor لنفس المشروع المرتبط بـ Vercel.
        </div>
      </Card>
    </div>
  );
}

