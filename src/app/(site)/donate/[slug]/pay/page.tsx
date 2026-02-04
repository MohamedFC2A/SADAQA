import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { DonationCheckout } from "@/app/(site)/donate/[slug]/pay/donation-checkout";

export const dynamic = "force-dynamic";

export default async function DonatePayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,is_active",
    )
    .eq("slug", slug)
    .single();

  if (error || !data || !data.is_active) notFound();

  const campaign = {
    id: String(data.id),
    slug: String(data.slug),
    title: String(data.title),
    description: typeof data.description === "string" ? data.description : null,
    image_url: typeof data.image_url === "string" ? data.image_url : null,
    currency: String(data.currency ?? "EGP"),
    min_amount: Number(data.min_amount ?? 10),
    max_amount: Number(data.max_amount ?? 100),
    goal_amount: Number(data.goal_amount ?? 0),
    is_active: Boolean(data.is_active),
  };

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden bg-black p-8 text-white">
        <Image
          src={campaign.image_url ?? "/images/donate-hero.jpg"}
          alt={campaign.title}
          fill
          priority
          className="object-cover blur-md opacity-60 scale-110"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(0,0,0,.78),rgba(0,0,0,.3),rgba(0,0,0,.85))]" />
        <div className="relative z-10 space-y-2">
          <div className="text-xs font-semibold text-white/70">صفحة الدفع</div>
          <h1 className="text-3xl font-semibold">{campaign.title}</h1>
          {campaign.description ? (
            <p className="max-w-3xl text-sm leading-7 text-white/80">
              {campaign.description}
            </p>
          ) : null}
        </div>
      </Card>

      <DonationCheckout campaign={campaign} />
    </div>
  );
}

