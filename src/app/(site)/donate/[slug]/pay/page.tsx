import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { DonationCheckout } from "@/app/(site)/donate/[slug]/pay/donation-checkout";

export const dynamic = "force-dynamic";

export default async function DonatePayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/donate/${slug}/pay`)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name,phone")
    .eq("id", user.id)
    .maybeSingle();

  const name = typeof profile?.name === "string" ? profile.name.trim() : "";
  const phone = typeof profile?.phone === "string" ? profile.phone.trim() : "";
  if (name.length < 2 || phone.length < 8) {
    redirect(`/onboarding?next=${encodeURIComponent(`/donate/${slug}/pay`)}`);
  }

  const { data, error } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,is_active",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="space-y-2 border border-pal-gold/30 bg-pal-gold/10 p-6">
          <div className="text-lg font-semibold">تعذر تحميل صفحة الدفع</div>
          <div className="text-sm text-muted-foreground">
            يوجد خطأ في الاتصال بقاعدة البيانات:{" "}
            <span className="font-mono">{error.message}</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <ButtonLink href="/donate" variant="secondary">
              الرجوع لصفحة التبرعات
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

  if (!data) {
    const { data: candidates, error: candidatesError } = await supabase
      .from("donation_campaigns")
      .select(
        "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,is_active",
      )
      .ilike("title", `%${slug}%`)
      .limit(6);

    if (candidatesError) {
      return (
        <div className="space-y-6">
          <Card className="space-y-2 border border-pal-gold/30 bg-pal-gold/10 p-6">
            <div className="text-lg font-semibold">تعذر تحميل صفحة الدفع</div>
            <div className="text-sm text-muted-foreground">
              حدث خطأ أثناء البحث عن الحملة:{" "}
              <span className="font-mono">{candidatesError.message}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <ButtonLink href="/donate" variant="secondary">
                الرجوع لصفحة التبرعات
              </ButtonLink>
            </div>
          </Card>
        </div>
      );
    }

    let list = (candidates ?? []).filter(
      (x): x is NonNullable<typeof x> => Boolean(x),
    );

    if (list.length === 0 && slug.includes("رمضان")) {
      const { data: ramadanCandidates } = await supabase
        .from("donation_campaigns")
        .select(
          "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,is_active",
        )
        .ilike("slug", "%ramadan%")
        .limit(6);

      list = (ramadanCandidates ?? []).filter(
        (x): x is NonNullable<typeof x> => Boolean(x),
      );
    }

    if (list.length === 1) {
      redirect(`/donate/${encodeURIComponent(String(list[0].slug))}/pay`);
    }

    return (
      <div className="space-y-6">
        <Card className="space-y-3 p-6">
          <div className="text-xl font-semibold">الحملة غير موجودة</div>
          <p className="text-sm leading-7 text-muted-foreground">
            لم نعثر على حملة بعنوان/Slug مطابق لـ{" "}
            <span className="font-mono">{slug}</span>.
          </p>

          {list.length > 1 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">هل تقصد واحدة من هذه؟</div>
              <div className="flex flex-col gap-2">
                {list.map((c) => (
                  <ButtonLink
                    key={String(c.id)}
                    href={`/donate/${encodeURIComponent(String(c.slug))}/pay`}
                    variant="secondary"
                    className="justify-between"
                  >
                    <span className="truncate">{String(c.title)}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(c.slug)}
                    </span>
                  </ButtonLink>
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <ButtonLink href="/donate" variant="primary">
              عرض كل الحملات
            </ButtonLink>
          </div>
        </Card>
      </div>
    );
  }

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
          className="object-cover blur-sm opacity-55 scale-110"
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
