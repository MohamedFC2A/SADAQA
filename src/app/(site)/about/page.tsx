import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pillars = [
  { title: "غير ربحية", desc: "كل التبرعات تصل للحالات الموثقة دون اقتطاع." },
  { title: "شفافية", desc: "كود تتبع لكل طلب وتحديثات مستمرة للحالة." },
  { title: "خصوصية", desc: "إخفاء الاسم متاح، والبيانات لا تُعرض للعامة." },
  { title: "سرعة", desc: "مسارات عاجلة للحالات الطبية والسكنية والغذائية." },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge tone="success">من نحن</Badge>
        <h1 className="text-3xl font-semibold">MADDAD — عون موثوق وسريع</h1>
        <p className="max-w-3xl text-black/70 dark:text-white/70 leading-7">
          مبادرة أهلية غير ربحية تربط أهل الخير بالحالات الأَولى بالدعم. نتحقق من
          الطلبات، نربطها بالمتبرعين، ونضمن تسليم المساعدة مع تحديثات واضحة.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pillars.map((p) => (
          <Card key={p.title} className="p-6 space-y-2">
            <div className="text-lg font-semibold">{p.title}</div>
            <div className="text-sm text-black/70 dark:text-white/70">{p.desc}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-3">
        <div className="text-sm font-semibold">كيف نعمل؟</div>
        <div className="text-sm text-black/70 dark:text-white/70 leading-7">
          <ol className="list-decimal space-y-2 pr-5">
            <li>استقبال الطلبات والتحقق منها (ميدانيًا أو عبر مستندات داعمة).</li>
            <li>توجيه الحالة للفريق المناسب (طبي، غذائي، سكني) مع تحديد الأولوية.</li>
            <li>جمع التبرعات وربطها بكود تتبع للحالة.</li>
            <li>التسليم والتحديث الختامي للمتبرعين وصاحب الطلب.</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}
