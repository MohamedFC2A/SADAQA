import { Card } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">من نحن</h1>
      <Card className="p-6">
        <p className="leading-8 text-black/70 dark:text-white/70">
          ALZAKA منصة تهدف لتسهيل التبرع وطلبات المساعدة مع التركيز على الخصوصية
          والشفافية وسهولة الاستخدام.
        </p>
      </Card>
    </div>
  );
}

