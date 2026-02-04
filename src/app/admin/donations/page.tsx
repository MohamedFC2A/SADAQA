import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DonationRow = {
  id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  phone: string | null;
  created_at: string;
  donation_campaigns?: { title?: string | null } | null;
};

export default async function AdminDonationsPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id,amount,currency,donor_name,phone,created_at,donation_campaigns(title)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as DonationRow[];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold">التبرعات</h1>
        <Badge tone="neutral">آخر 50 تبرع</Badge>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-pal-red">خطأ في تحميل البيانات.</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-black/60 dark:text-white/60">
            لا توجد تبرعات حتى الآن.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-black/70 dark:bg-white/10 dark:text-white/70">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">الحملة</th>
                  <th className="px-4 py-3 text-right font-semibold">القيمة</th>
                  <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-right font-semibold">الهاتف</th>
                  <th className="px-4 py-3 text-right font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
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
                      <span className="text-black/60 dark:text-white/60">
                        {r.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {r.donor_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {r.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-black/60 dark:text-white/60">
                      {new Date(r.created_at).toLocaleString("ar")}
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
