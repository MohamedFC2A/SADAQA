import { Card } from "@/components/ui/card";

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">التواصل</h1>
        <p className="text-black/70 dark:text-white/70">
          تواصل معنا لأي استفسار أو لمتابعة حالة تبرع/طلب مساعدة.
        </p>
      </div>
      <Card className="p-6">
        <p className="leading-8 text-black/70 dark:text-white/70">
          سيتم إضافة نموذج تواصل وروابط السوشيال ميديا في المرحلة القادمة.
        </p>
      </Card>
    </div>
  );
}
