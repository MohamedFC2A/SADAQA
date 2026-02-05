import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignCreator } from "@/app/admin/campaigns/campaign-creator";
import { CampaignActions } from "@/app/admin/campaigns/campaign-actions";

export default async function AdminCampaignsPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,is_active,min_amount,max_amount,goal_amount,currency,is_featured,is_new,sort_rank,ends_on,created_at",
    )
    .order("is_featured", { ascending: false })
    .order("sort_rank", { ascending: false })
    .order("created_at", { ascending: false });

  // Backward compatibility if the DB wasn't migrated yet.
  const fallback =
    error?.message?.includes('column "goal_amount"') ||
    error?.message?.includes('column "image_url"');
  const { data: dataFallback } = fallback
    ? await supabase
        .from("donation_campaigns")
        .select("id,slug,title,is_active,min_amount,max_amount,currency,ends_on,created_at")
        .order("created_at", { ascending: false })
    : { data: null as unknown };

  const rawList = (fallback ? dataFallback : data) ?? [];
  const rows = (rawList as Array<Record<string, unknown>>).map((c) => ({
    id: String(c["id"] ?? ""),
    slug: String(c["slug"] ?? ""),
    title: String(c["title"] ?? ""),
    is_active: Boolean(c["is_active"]),
    min_amount: Number(c["min_amount"] ?? 10),
    max_amount: Number(c["max_amount"] ?? 100),
    currency: String(c["currency"] ?? "EGP"),
    goal_amount: Number(c["goal_amount"] ?? 10000),
    is_featured: c["is_featured"] === true,
    is_new: c["is_new"] === true,
    sort_rank: Number(c["sort_rank"] ?? 0),
    ends_on: typeof c["ends_on"] === "string" ? c["ends_on"] : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-semibold">حملات التبرع</h1>
        <Badge tone="neutral">إدارة الحملات</Badge>
      </div>

      {error ? (
        <Card className="p-4 border border-pal-gold/30 bg-pal-gold/10">
          <div className="text-sm font-semibold">تنبيه</div>
          <div className="text-xs text-black/70 dark:text-white/70">
            يوجد خطأ في قاعدة البيانات:{" "}
            <span className="font-mono">{error.message}</span>. إذا كان السبب
            أعمدة ناقصة، شغّل <span className="font-mono">supabase/schema.sql</span>.
          </div>
        </Card>
      ) : null}

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
                  <th className="px-4 py-3 text-right font-semibold">وسوم</th>
                  <th className="px-4 py-3 text-right font-semibold">أولوية</th>
                  <th className="px-4 py-3 text-right font-semibold">المدى</th>
                  <th className="px-4 py-3 text-right font-semibold">الهدف</th>
                  <th className="px-4 py-3 text-right font-semibold">نهاية</th>
                  <th className="px-4 py-3 text-right font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    إجراءات
                  </th>
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
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {c.is_featured ? <Badge tone="warning">مميز</Badge> : null}
                        {c.is_new ? <Badge tone="success">جديد</Badge> : null}
                        {!c.is_featured && !c.is_new ? <Badge tone="neutral">—</Badge> : null}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {c.sort_rank}
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {c.min_amount}–{c.max_amount} {c.currency}
                    </td>
                    <td className="px-4 py-3 text-black/70 dark:text-white/70">
                      {c.goal_amount} {c.currency}
                    </td>
                    <td className="px-4 py-3 text-black/60 dark:text-white/60">
                      {c.ends_on ? c.ends_on : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={c.is_active ? "success" : "neutral"}>
                        {c.is_active ? "نشط" : "غير نشط"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <CampaignActions id={c.id} />
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
