import { DonateCampaign } from "@/app/(site)/donate/donate-campaign";
import Image from "next/image";

export default function DonatePage() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-black p-8 shadow-sm dark:border-white/10">
        <Image
          src="/images/donate-hero.jpg"
          alt="تبرعات الطعام"
          fill
          priority
          className="object-cover blur-md opacity-70 scale-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(0,0,0,.75),rgba(0,0,0,.35),rgba(0,0,0,.75))]" />
        <div className="relative z-10 space-y-3">
          <h1 className="font-brand text-4xl font-bold tracking-wide text-white">
            SADAQA
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/85">
            تبرعك يصنع فرقاً حقيقياً. اختر حملة “إطعام المساكين” وسجّل تبرعك الآن.
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <span className="h-2 w-2 rounded-full bg-pal-red" />
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-2 rounded-full bg-pal-green" />
            <span className="h-2 w-2 rounded-full bg-pal-gold" />
            <span className="mr-2">ألوان فلسطين — مع رسالة عطاء</span>
          </div>
        </div>
      </section>

      <DonateCampaign />
    </div>
  );
}
