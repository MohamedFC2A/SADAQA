import { Card } from "@/components/ui/card";
import { RequestStatusChecker } from "@/app/(site)/request-help/status/request-status-checker";

export default function RequestStatusPage({
  searchParams,
}: {
  searchParams?: { id?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">تتبع طلب المساعدة</h1>
        <p className="text-muted-foreground">
          أدخل رقم الطلب ورقم الهاتف الذي تم التسجيل به لمعرفة حالة الطلب.
        </p>
      </div>
      <Card className="p-6">
        <RequestStatusChecker initialId={searchParams?.id ?? ""} />
      </Card>
    </div>
  );
}
