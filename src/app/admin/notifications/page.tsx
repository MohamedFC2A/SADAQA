import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminNotificationsClient } from "@/app/admin/notifications/admin-notifications-client";

export const dynamic = "force-dynamic";

type UserOption = { id: string; name: string; phone: string | null };

type NotificationRow = {
  id: string;
  scope: "global" | "user";
  target_user_id: string | null;
  title: string;
  body: string;
  link_url: string | null;
  created_at: string;
};

export default async function AdminNotificationsPage() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const supabase = createSupabaseAdminClient();

  const { data: usersData } = await supabase
    .from("profiles")
    .select("id,name,phone,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const users: UserOption[] = (usersData ?? []).map((u: any) => ({
    id: String(u.id ?? ""),
    name: typeof u.name === "string" ? u.name : "—",
    phone: typeof u.phone === "string" ? u.phone : null,
  }));

  const { data: notifsData, error: notifsError } = await supabase
    .from("notifications")
    .select("id,scope,target_user_id,title,body,link_url,created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const schemaOutdated =
    notifsError?.message?.toLowerCase().includes("notifications") &&
    notifsError?.message?.toLowerCase().includes("does not exist");

  const notifications = ((notifsData ?? []) as Array<Record<string, unknown>>).map(
    (n) =>
      ({
        id: String(n["id"] ?? ""),
        scope: (n["scope"] === "user" ? "user" : "global") as "global" | "user",
        target_user_id:
          typeof n["target_user_id"] === "string" ? (n["target_user_id"] as string) : null,
        title: typeof n["title"] === "string" ? (n["title"] as string) : "",
        body: typeof n["body"] === "string" ? (n["body"] as string) : "",
        link_url: typeof n["link_url"] === "string" ? (n["link_url"] as string) : null,
        created_at: typeof n["created_at"] === "string" ? (n["created_at"] as string) : "",
      }) satisfies NotificationRow,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold">الإشعارات</h1>
          <Badge tone="neutral">لوحة الأدمن</Badge>
        </div>
      </div>

      {schemaOutdated ? (
        <Card className="p-4 border border-pal-gold/30 bg-pal-gold/10">
          <div className="text-sm font-semibold">تنبيه</div>
          <div className="text-xs text-muted-foreground">
            جدول الإشعارات غير موجود. شغّل <span className="font-mono">supabase/schema.sql</span>{" "}
            داخل Supabase SQL Editor.
          </div>
        </Card>
      ) : null}

      <Card className="p-6">
        <AdminNotificationsClient users={users} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-surface-2 p-4">
          <div className="text-sm font-semibold">آخر 50 إشعار</div>
        </div>
        {notifications.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">لا توجد إشعارات بعد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-right font-semibold">النوع</th>
                  <th className="px-4 py-3 text-right font-semibold">العنوان</th>
                  <th className="px-4 py-3 text-right font-semibold">المستخدم</th>
                  <th className="px-4 py-3 text-right font-semibold">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id} className="border-t border-border hover:bg-surface-2">
                    <td className="px-4 py-3 text-muted-foreground">
                      {n.scope === "global" ? "عام" : "مستخدم"}
                    </td>
                    <td className="px-4 py-3 font-semibold">{n.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {n.scope === "user" ? (n.target_user_id ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {n.created_at ? new Date(n.created_at).toLocaleString("ar") : "—"}
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

