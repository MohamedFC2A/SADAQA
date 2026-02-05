import { Card } from "@/components/ui/card";
import { RequestHelpForm } from "@/app/(site)/request-help/request-help-form";

export default function RequestHelpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">طلب مساعدة عاجلة</h1>
        <p className="text-black/70 dark:text-white/70">
          عبئ البيانات بدقة لنوصل الدعم الصحيح بأسرع وقت. اسمك ورقمك يُسحبان من
          حسابك عند تسجيل الدخول لضمان صحة التواصل، ولا تظهر للعلن.
        </p>
      </div>
      <Card className="p-6">
        <RequestHelpForm />
      </Card>
    </div>
  );
}
