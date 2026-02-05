import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { Card } from "@/components/ui/card";
import { AdminTopbar } from "@/app/admin/topbar";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card className="p-6 space-y-3">
          <div className="text-2xl font-semibold">غير مصرح</div>
          <p className="text-muted-foreground">
            حسابك لا يملك صلاحية الأدمن للوصول لهذه الصفحة.
          </p>
          <Link
            href="/"
            className="text-sm font-semibold text-pal-green hover:underline"
          >
            العودة للرئيسية
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AdminTopbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
