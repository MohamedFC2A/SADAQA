import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { DonationEditor } from "@/app/admin/donations/[id]/donation-editor";

type DonationRow = {
  id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  phone: string | null;
  campaign_id: string;
  payment_code?: string | null;
  payment_method?: string | null;
  status?: string | null;
  created_at: string;
};

type CampaignRow = {
  id: string;
  title: string;
  slug: string;
};

export default async function AdminDonationDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id,amount,currency,donor_name,phone,campaign_id,payment_code,payment_method,status,created_at",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="p-6 space-y-2">
          <div className="text-xl font-semibold">تعذر تحميل التبرع</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            {error?.message ? (
              <>
                الخطأ: <span className="font-mono">{error.message}</span>
                <div className="mt-2" />
              </>
            ) : null}
            غالباً قاعدة البيانات غير مُحدّثة أو مفاتيح Supabase على Vercel تشير
            لمشروع مختلف. شغّل{" "}
            <span className="font-mono">supabase/schema.sql</span> داخل Supabase
            SQL Editor للمشروع الصحيح ثم أعد المحاولة.
          </div>
        </Card>
      </div>
    );
  }

  const { data: campaigns } = await supabase
    .from("donation_campaigns")
    .select("id,title,slug")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">تفاصيل التبرع</h1>
        <div className="text-sm text-black/60 dark:text-white/60">
          ID: <span className="font-mono">{id}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <DonationEditor
            donation={data as DonationRow}
            campaigns={(campaigns ?? []) as CampaignRow[]}
          />
        </Card>
        <Card className="p-6 space-y-2">
          <div className="text-sm font-semibold">معلومات</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            <div>
              التاريخ:{" "}
              {new Date((data as DonationRow).created_at).toLocaleString("ar")}
            </div>
            <div>
              القيمة الحالية:{" "}
              <span className="font-semibold">{(data as DonationRow).amount}</span>{" "}
              {(data as DonationRow).currency}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
