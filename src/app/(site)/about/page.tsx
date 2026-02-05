import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const pillars = [
  { title: "مبادرة أهلية", desc: "مجتمع من المتطوعين ينسق الدعم للحالات الأَولى بالمساعدة." },
  { title: "غير ربحية", desc: "لا نبيع بيانات ولا نعرض إعلانات، وهدفنا توصيل الدعم بأمان." },
  { title: "شفافية", desc: "تتبع واضح للطلبات وتحديثات حالة مستمرة داخل لوحة الإدارة." },
  { title: "خصوصية", desc: "بياناتك للتواصل والتحقق فقط، وإخفاء الاسم متاح من صفحة الحساب." },
] as const;

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge tone="success">من نحن</Badge>
        <h1 className="text-3xl font-semibold">MADDAD — مبادرة أهلية للخير</h1>
        <p className="max-w-3xl text-muted-foreground leading-7">
          MADDAD مبادرة أهلية غير ربحية هدفها ربط أهل الخير بالحالات الأَولى
          بالدعم بطريقة منظمة، تحترم الخصوصية وتسهّل التحقق والمتابعة. نُراجع
          الطلبات، نطلب مستندات داعمة عند الحاجة، وننسق الدعم (علاجي/غذائي/سكني)
          حسب نوع الاحتياج.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pillars.map((p) => (
          <Card key={p.title} className="p-6 space-y-2">
            <div className="text-lg font-semibold">{p.title}</div>
            <div className="text-sm text-muted-foreground">{p.desc}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6 space-y-3">
        <div className="text-sm font-semibold">كيف نعمل؟</div>
        <div className="text-sm text-muted-foreground leading-7">
          <ol className="list-decimal space-y-2 pr-5">
            <li>تسجيل طلب المساعدة عبر الحساب لضمان صحة الاسم ورقم التواصل.</li>
            <li>تحديد نوع الاحتياج والتفصيل (مثلاً: دواء/تحاليل/وجبات جاهزة/بطاطين).</li>
            <li>رفع صور داعمة عند الطلب — خصوصاً في الحالات العلاجية (روشتة/تقرير/استشارة).</li>
            <li>مراجعة داخلية للحالة والتواصل للتأكد من البيانات والاستحقاق.</li>
            <li>تنسيق الدعم مع المتبرعين أو الفريق الميداني وتحديث الحالة حتى الإغلاق.</li>
          </ol>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-6 space-y-2 lg:col-span-2">
          <div className="text-sm font-semibold">التحقق وحماية البيانات</div>
          <p className="text-sm leading-7 text-muted-foreground">
            نستخدم بياناتك للتواصل والتحقق فقط، ولا ننشر رقم الهاتف أو العنوان
            للعامة. قد نطلب مستندات داعمة حسب نوع الاحتياج، ويمكنك تفعيل الوضع
            المجهول ليظهر اسمك كـ “مجهول” في النشاط الظاهر بحسابك.
          </p>
        </Card>
        <Card className="p-6 space-y-2">
          <div className="text-sm font-semibold">كيف تساعد؟</div>
          <p className="text-sm leading-7 text-muted-foreground">
            يمكنك التبرع عبر الحملات، أو مشاركة المنصة مع من يحتاجها، أو التطوع
            معنا لاحقاً عند توفر قنوات التطوع الرسمية.
          </p>
        </Card>
      </div>
    </div>
  );
}
