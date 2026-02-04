import { Card } from "@/components/ui/card";

export default function FaqPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">الأسئلة الشائعة</h1>
        <p className="text-black/70 dark:text-white/70">
          إجابات سريعة عن طريقة التبرع، والخصوصية، ومتابعة الطلبات.
        </p>
      </div>
      <Card className="p-6">
        <p className="leading-8 text-black/70 dark:text-white/70">
          سيتم إضافة الأسئلة الشائعة في المرحلة القادمة.
        </p>
      </Card>
    </div>
  );
}
