import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignCreator } from "@/app/admin/campaigns/campaign-creator";

type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  is_active: boolean;
  min_amount: number;
  max_amount: number;
  goal_amount: number;
  currency: string;
};

export default async function AdminCampaignsPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("donation_campaigns")
    .select("id,slug,title,is_active,min_amount,max_amount,goal_amount,currency")
    .order("created_at", { ascending: true });

  const rows = (data ?? []) as CampaignRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold">حملات التبرع</h1>
        <Badge tone="neutral">إدارة الحملات</Badge>
      </div>

      <Card className="p-6">
        <CampaignCreator />
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-black/60 dark:text-white/60">
            لا توجد حملات.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-black/70 dark:bg-white/10 dark:text-white/70">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-right font-semibold">Slug</th>
                  <th className="px-4 py-3 text-right font-semibold">المدى</th>
                  <th className="px-4 py-3 text-right font-semibold">الهدف</th>
                  <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/admin/campaigns/${c.id}`}
                        className="text-pal-green hover:underline"
                      >
                        {c.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-black/70 dark:text-white/70">
                      {c.slug}
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {c.min_amount}–{c.max_amount} {c.currency}
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {c.goal_amount} {c.currency}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={c.is_active ? "success" : "neutral"}>
                        {c.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

