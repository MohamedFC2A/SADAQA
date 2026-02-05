import Image from "next/image";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DonationCampaign as Campaign } from "@/lib/donations/types";
import { Card } from "@/components/ui/card";
import { DonationsGridClient } from "@/app/(site)/donate/donations-grid-client";

export const dynamic = "force-dynamic";

export default function DonatePage() {
  // Server-rendered to keep the page functional even when client env is misconfigured.
  const supabase = createSupabaseAdminClient();

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-black p-8 shadow-sm">
        <Image
          src="/images/donate-hero.jpg"
          alt="تبرعات الطعام"
          fill
          priority
          className="object-cover blur-sm opacity-65 scale-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(0,0,0,.75),rgba(0,0,0,.35),rgba(0,0,0,.75))]" />
        <div className="relative z-10 space-y-3">
          <h1 className="font-brand text-4xl font-bold tracking-wide text-white">
            MADDAD
          </h1>
          <p className="max-w-2xl text-base leading-7 text-white/85">
            تبرعك يصنع فرقاً حقيقياً. اختر الحملة المناسبة وسجّل تبرعك خلال دقيقة.
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
  const { data: campaigns, error } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,starts_on,ends_on,is_active,is_featured,is_new,sort_rank,created_at",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_rank", { ascending: false })
    .order("created_at", { ascending: false });

  const schemaOutdated =
    error?.message?.includes('column "image_url"') ||
    error?.message?.includes('column "goal_amount"') ||
    error?.message?.includes('column "is_featured"') ||
    error?.message?.includes('column "is_new"') ||
    error?.message?.includes('column "sort_rank"');

  const { data: campaignsFallback } = schemaOutdated
    ? await supabase
        .from("donation_campaigns")
        .select(
          "id,slug,title,description,currency,min_amount,max_amount,starts_on,ends_on,is_active,created_at",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
    : { data: null as unknown };

  const raw = (schemaOutdated ? campaignsFallback : campaigns) ?? [];
  const list = (raw as Array<Record<string, unknown>>).map((c) => ({
    id: String(c["id"] ?? ""),
    slug: String(c["slug"] ?? ""),
    title: String(c["title"] ?? ""),
    description: typeof c["description"] === "string" ? c["description"] : null,
    image_url: typeof c["image_url"] === "string" ? c["image_url"] : null,
    currency: String(c["currency"] ?? "EGP"),
    min_amount: Number(c["min_amount"] ?? 10),
    max_amount: Number(c["max_amount"] ?? 100),
    goal_amount: Number(c["goal_amount"] ?? 10000),
    starts_on: typeof c["starts_on"] === "string" ? c["starts_on"] : null,
    ends_on: typeof c["ends_on"] === "string" ? c["ends_on"] : null,
    is_active: Boolean(c["is_active"]),
    is_featured: c["is_featured"] === true,
    is_new: c["is_new"] === true,
    sort_rank: Number(c["sort_rank"] ?? 0),
    created_at: typeof c["created_at"] === "string" ? c["created_at"] : null,
  })) as Campaign[];
  const ids = list.map((c) => c.id);

  const totals = new Map<string, number>();
  if (ids.length > 0) {
    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("campaign_id,amount,status")
      .in("campaign_id", ids);

    const missingStatus =
      donationsError?.message?.includes('column "status"') ||
      donationsError?.message?.includes("status does not exist");

    const donationsFallback = missingStatus
      ? await supabase
          .from("donations")
          .select("campaign_id,amount")
          .in("campaign_id", ids)
      : null;

    const rows = (missingStatus ? donationsFallback?.data : donations) ?? [];

    for (const row of rows as Array<{
      campaign_id: string;
      amount: number;
      status?: string | null;
    }>) {
      if (!missingStatus && row.status && row.status !== "verified") continue;
      totals.set(row.campaign_id, (totals.get(row.campaign_id) ?? 0) + row.amount);
    }
  }

  return (
    <div className="space-y-8">
      {error ? (
        <Card className="p-4 border border-pal-gold/30 bg-pal-gold/10">
          <div className="text-sm font-semibold">تنبيه</div>
          <div className="text-xs text-muted-foreground">
            يوجد خطأ في قاعدة البيانات:{" "}
            <span className="font-mono">{error.message}</span>. إذا كان السبب
            أعمدة ناقصة، شغّل <span className="font-mono">supabase/schema.sql</span>.
          </div>
        </Card>
      ) : null}

      <DonationsGridClient
        items={list.map((c) => ({ campaign: c, totalDonated: totals.get(c.id) ?? 0 }))}
      />
    </div>
  );
}
