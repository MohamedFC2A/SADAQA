import { Card } from "@/components/ui/card";
import { RequestHelpForm } from "@/app/(site)/request-help/request-help-form";

export default function RequestHelpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">طلب مساعدة</h1>
        <p className="text-black/70 dark:text-white/70">
          اكتب تفاصيل الحالة بدقة. لن تُعرض بياناتك علناً، وسيتم التواصل معك من
          فريق الإدارة.
        </p>
      </div>
      <Card className="p-6">
        <RequestHelpForm />
      </Card>
    </div>
  );
}

