import { notFound } from "next/navigation";
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
  params: { id: string };
}) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donations")
    .select("id,amount,currency,donor_name,phone,campaign_id,created_at")
    .eq("id", params.id)
    .single();

  if (error || !data) notFound();

  const { data: campaigns } = await supabase
    .from("donation_campaigns")
    .select("id,title,slug")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">تفاصيل التبرع</h1>
        <div className="text-sm text-black/60 dark:text-white/60">
          ID: <span className="font-mono">{params.id}</span>
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
