import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

export default function RequestHelpSuccessPage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  const id = searchParams?.id;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">تم إرسال الطلب</h1>
      <Card className="p-6 space-y-3">
        <p className="text-black/70 dark:text-white/70">
          شكراً لك. سيتم مراجعة طلبك والتواصل معك عند الحاجة.
        </p>
        <div className="rounded-xl border border-black/10 bg-black/5 p-3 text-sm dark:border-white/10 dark:bg-white/10">
          رقم الطلب: <span className="font-mono">{id ?? "—"}</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/" variant="secondary">
            العودة للرئيسية
          </ButtonLink>
          <Link
            className="text-sm font-semibold text-pal-green hover:underline"
            href="/request-help"
          >
            إرسال طلب آخر
          </Link>
        </div>
      </Card>
    </div>
  );
}
