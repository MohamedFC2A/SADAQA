import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">من نحن</h1>
        <p className="text-black/70 dark:text-white/70">
          منصة عربية تجمع بين الصدقات والتبرعات وطلبات المساعدة.
        </p>
      </div>
      <Card className="p-6">
        <p className="leading-8 text-black/70 dark:text-white/70">
          MADDAD منصة تهدف لتسهيل التبرع وطلبات المساعدة مع التركيز على الخصوصية
          والشفافية وسهولة الاستخدام.
        </p>
      </Card>
    </div>
  );
}
