import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NotificationsClient } from "@/app/(site)/notifications/notifications-client";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/notifications");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">الإشعارات</h1>
        <p className="text-muted-foreground">
          هنا ستجد كل الإشعارات العامة والإشعارات الموجهة لك.
        </p>
      </div>

      <Card className="p-6">
        <NotificationsClient />
      </Card>
    </div>
  );
}

