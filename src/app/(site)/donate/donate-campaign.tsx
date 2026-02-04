import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import type { DonationCampaign } from "@/lib/donations/types";

function formatEgp(amount: number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(
    amount,
  );
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function DonateCampaign({
  campaign,
  totalDonated,
}: {
  campaign: DonationCampaign;
  totalDonated: number;
}) {
  const progress = clamp01(
    campaign.goal_amount > 0 ? totalDonated / campaign.goal_amount : 0,
  );
  const remaining = Math.max(0, campaign.goal_amount - totalDonated);

  return (
    <Card className="group relative overflow-hidden bg-transparent">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${campaign.image_url ?? "/images/donate-hero.jpg"})`,
            filter: "blur(12px)",
            transform: "scale(1.12)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.55),rgba(0,0,0,.2),rgba(0,0,0,.78))]" />
      </div>

      <div className="relative z-10 flex aspect-square flex-col p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xl font-semibold leading-tight">
                {campaign.title}
              </div>
              {campaign.is_active ? <Badge tone="success">نشط</Badge> : null}
            </div>
            {campaign.description ? (
              <p className="line-clamp-2 text-sm leading-6 text-white/80">
                {campaign.description}
              </p>
            ) : (
              <p className="text-sm leading-6 text-white/60">تبرع الآن.</p>
            )}
          </div>
          <div className="shrink-0 rounded-2xl bg-pal-green/15 px-4 py-2 text-sm font-semibold text-white">
            {campaign.currency}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-pal-green/70"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/75">
              <div>
                تم جمع:{" "}
                <span className="font-semibold text-white">
                  {formatEgp(totalDonated)} ج
                </span>
              </div>
              <div>
                المتبقي:{" "}
                <span className="font-semibold text-white">
                  {formatEgp(remaining)} ج
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold text-white/75">
              من {formatEgp(campaign.min_amount)} إلى{" "}
              {formatEgp(campaign.max_amount)} ج
            </div>
            <ButtonLink
              href={`/donate/${encodeURIComponent(campaign.slug)}/pay`}
              className="h-11 rounded-xl px-5"
            >
              تبرع
            </ButtonLink>
          </div>
        </div>
      </div>
    </Card>
  );
}
