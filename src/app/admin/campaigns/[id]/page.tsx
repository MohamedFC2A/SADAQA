import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { CampaignEditor } from "@/app/admin/campaigns/[id]/campaign-editor";

type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  min_amount: number;
  max_amount: number;
  goal_amount: number;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
};

export default async function AdminCampaignDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,starts_on,ends_on,is_active",
    )
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="p-6 space-y-2">
          <div className="text-xl font-semibold">تعذر تحميل الحملة</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            غالباً قاعدة البيانات غير مُحدّثة. شغّل ملف{" "}
            <span className="font-mono">supabase/schema.sql</span> داخل Supabase
            SQL Editor ثم أعد المحاولة.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">تعديل الحملة</h1>
        <div className="text-sm text-black/60 dark:text-white/60">
          ID: <span className="font-mono">{params.id}</span>
        </div>
      </div>
      <Card className="p-6">
        <CampaignEditor campaign={data as CampaignRow} />
      </Card>
    </div>
  );
}
