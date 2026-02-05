import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DonationActions } from "@/app/admin/donations/donation-actions";
import { DonationCreator } from "@/app/admin/donations/donation-creator";
import { PurgeAllButton } from "@/app/admin/purge-all-button";

type DonationRow = {
  id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  phone: string | null;
  payment_code?: string | null;
  payment_method?: string | null;
  status?: string | null;
  created_at: string;
  donation_campaigns?: { title?: string | null } | null;
};

type CampaignRow = { id: string; title: string; slug: string; currency: string };

export default async function AdminDonationsPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();
  const { data: campaigns } = await supabase
    .from("donation_campaigns")
    .select("id,title,slug,currency")
    .order("created_at", { ascending: true });
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id,amount,currency,donor_name,phone,payment_code,payment_method,status,created_at,donation_campaigns(title)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as DonationRow[];
  const campaignRows = (campaigns ?? []) as CampaignRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">التبرعات</h1>
          <Badge tone="neutral">آخر 50 تبرع</Badge>
        </div>
        <PurgeAllButton endpoint="/api/admin/donations" label="كل التبرعات" />
      </div>

      <Card className="p-6">
        {campaignRows.length > 0 ? (
          <DonationCreator campaigns={campaignRows} />
        ) : (
          <div className="text-sm text-muted-foreground">
            أنشئ حملة تبرع أولاً من صفحة الحملات.
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-pal-red">خطأ في تحميل البيانات.</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            لا توجد تبرعات حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">الحملة</th>
                  <th className="px-4 py-3 text-right font-semibold">القيمة</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    كود الدفع
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    الطريقة/الحالة
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-right font-semibold">الهاتف</th>
                  <th className="px-4 py-3 text-right font-semibold">التاريخ</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-border hover:bg-surface-2"
                  >
                    <td className="px-4 py-3 font-semibold">
                      <Link
                        href={`/admin/donations/${r.id}`}
                        className="text-pal-green hover:underline"
                      >
                        {r.donation_campaigns?.title ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{r.amount}</span>{" "}
                      <span className="text-muted-foreground">
                        {r.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {r.payment_code ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs">
                          {r.payment_method ?? "—"}
                        </div>
                        <div className="text-xs font-semibold">
                          {r.status ?? "—"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.donor_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("ar")}
                    </td>
                    <td className="px-4 py-3">
                      <DonationActions id={r.id} />
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
