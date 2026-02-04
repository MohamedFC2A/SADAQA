import Image from "next/image";
import { DonateCampaign } from "@/app/(site)/donate/donate-campaign";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DonationCampaign as Campaign } from "@/lib/donations/types";

export const dynamic = "force-dynamic";

export default function DonatePage() {
  // Server-rendered to keep the page functional even when client env is misconfigured.
  const supabase = createSupabaseAdminClient();

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

      <DonationsContent supabase={supabase} />
    </div>
  );
}

async function DonationsContent({
  supabase,
}: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
}) {
  const { data: campaigns } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,starts_on,ends_on,is_active",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const list = (campaigns ?? []) as Campaign[];
  const ids = list.map((c) => c.id);

  const totals = new Map<string, number>();
  if (ids.length > 0) {
    const { data: donations } = await supabase
      .from("donations")
      .select("campaign_id,amount")
      .in("campaign_id", ids);

    for (const row of (donations ?? []) as Array<{
      campaign_id: string;
      amount: number;
    }>) {
      totals.set(row.campaign_id, (totals.get(row.campaign_id) ?? 0) + row.amount);
    }
  }

  return (
    <div className="space-y-8">
      {list.map((c) => (
        <DonateCampaign key={c.id} campaign={c} totalDonated={totals.get(c.id) ?? 0} />
      ))}
    </div>
  );
}
