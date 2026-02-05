import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  requestStatuses,
  requestTypes,
  requestTypeLabelAr,
  statusLabelAr,
  type RequestStatus,
  type RequestType,
} from "@/lib/requests/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RequestActions } from "@/app/admin/requests/request-actions";
import { PurgeAllButton } from "@/app/admin/purge-all-button";

type RequestRow = {
  id: string;
  requester_name: string;
  location: string;
  request_type: RequestType;
  status: RequestStatus;
  created_at: string;
};

function toneForStatus(status: RequestStatus): "neutral" | "success" | "danger" {
  if (status === "approved" || status === "completed") return "success";
  if (status === "rejected") return "danger";
  return "neutral";
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    type?: string;
    page?: string;
  };
}) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const status =
    searchParams?.status &&
    requestStatuses.includes(searchParams.status as RequestStatus)
      ? (searchParams.status as RequestStatus)
      : undefined;
  const type =
    searchParams?.type && requestTypes.includes(searchParams.type as RequestType)
      ? (searchParams.type as RequestType)
      : undefined;
  const page = Math.max(1, Number(searchParams?.page ?? "1") || 1);

  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("requests")
    .select(
      "id,requester_name,location,request_type,status,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("status", status);
  if (type) query = query.eq("request_type", type);

  const { data, error, count } = await query;
  const rows = (data ?? []) as RequestRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildUrl(
    next: Partial<{
      status: string;
      type: string;
      page: string;
    }>,
  ) {
    const params = new URLSearchParams();
    const s = next.status ?? status;
    const t = next.type ?? type;
    const p = next.page ?? String(page);
    if (s) params.set("status", s);
    if (t) params.set("type", t);
    if (p) params.set("page", p);
    return `/admin/requests?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">طلبات المساعدة</h1>
          <div className="text-sm text-muted-foreground">
            الإجمالي: {total}
          </div>
        </div>
        <PurgeAllButton endpoint="/api/admin/requests" label="كل الطلبات" />
      </div>

      <Card className="p-6">
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-3" method="GET">
          <div className="space-y-2">
            <label className="text-sm font-semibold">الحالة</label>
            <Select name="status" defaultValue={status ?? ""}>
              <option value="">الكل</option>
              {requestStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabelAr[s]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">النوع</label>
            <Select name="type" defaultValue={type ?? ""}>
              <option value="">الكل</option>
              {requestTypes.map((t) => (
                <option key={t} value={t}>
                  {requestTypeLabelAr[t]}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full">
              تطبيق
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-6 text-sm text-pal-red">خطأ في تحميل البيانات.</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            لا توجد طلبات مطابقة للفلتر الحالي.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">الاسم</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    المنطقة
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">النوع</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    تاريخ
                  </th>
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
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="font-semibold text-pal-green hover:underline"
                      >
                        {r.requester_name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {r.location}
                    </td>
                    <td className="px-4 py-3">{requestTypeLabelAr[r.request_type]}</td>
                    <td className="px-4 py-3">
                      <Badge tone={toneForStatus(r.status)}>
                        {statusLabelAr[r.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("ar")}
                    </td>
                    <td className="px-4 py-3">
                      <RequestActions id={r.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          صفحة {page} من {totalPages}
        </div>
        <div className="flex gap-2">
          <Link
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              page <= 1
                ? "pointer-events-none opacity-50"
                : "border-border hover:bg-surface-2"
            }`}
            href={buildUrl({ page: String(page - 1) })}
          >
            السابق
          </Link>
          <Link
            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
              page >= totalPages
                ? "pointer-events-none opacity-50"
                : "border-border hover:bg-surface-2"
            }`}
            href={buildUrl({ page: String(page + 1) })}
          >
            التالي
          </Link>
        </div>
      </div>
    </div>
  );
}
