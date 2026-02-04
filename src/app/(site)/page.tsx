import { HeartHandshake, HandCoins, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";

const highlights = [
  {
    title: "شفافية",
    icon: ShieldCheck,
    description: "متابعة واضحة لحالة الطلبات وعمليات الدعم.",
  },
  {
    title: "سهولة",
    icon: HeartHandshake,
    description: "نموذج طلب مساعدة بسيط ومُهيأ للجميع.",
  },
  {
    title: "عطاء",
    icon: HandCoins,
    description: "زكاة وصدقات وتبرعات لدعم المحتاجين.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-pal-red" />
            <div className="h-3 w-3 rounded-full bg-pal-black dark:bg-white" />
            <div className="h-3 w-3 rounded-full bg-pal-green" />
            <div className="h-3 w-3 rounded-full bg-pal-gold" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            ALZAKA — منصة الزكاة والتبرعات
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-black/70 dark:text-white/70">
            منصة عربية تجمع بين التبرع وطلبات المساعدة، بواجهة تحترم الخصوصية
            وتُسهل الوصول للدعم.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/request-help" variant="primary">
              طلب مساعدة
            </ButtonLink>
            <ButtonLink href="/donate" variant="secondary">
              تبرع (قريباً)
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {highlights.map((h) => {
          const Icon = h.icon;
          return (
            <Card key={h.title} className="p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-pal-green/10 text-pal-green dark:bg-pal-green/20">
                  <Icon size={20} />
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{h.title}</div>
                  <p className="text-sm leading-6 text-black/70 dark:text-white/70">
                    {h.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
