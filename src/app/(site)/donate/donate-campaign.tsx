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

function isEndingSoon(endsOn: string | null) {
  if (!endsOn) return false;
  const end = new Date(endsOn);
  if (Number.isNaN(end.getTime())) return false;
  const now = Date.now();
  const diffDays = (end.getTime() - now) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
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
  const percent = Math.round(progress * 100);
  const endingSoon = isEndingSoon(campaign.ends_on);

  return (
    <Card className="group relative overflow-hidden bg-transparent">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${campaign.image_url ?? "/images/donate-hero.jpg"})`,
            filter: "blur(4px)",
            transform: "scale(1.08)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.45),rgba(0,0,0,.12),rgba(0,0,0,.74))]" />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_25%_15%,rgba(212,175,55,.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(20,153,84,.16),transparent_45%)]" />
      </div>

      <div className="relative z-10 flex aspect-square flex-col p-6 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {campaign.is_featured ? <Badge tone="warning">مميز</Badge> : null}
              {campaign.is_new ? <Badge tone="success">جديد</Badge> : null}
              {endingSoon ? <Badge tone="danger">ينتهي قريباً</Badge> : null}
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
            الهدف: {formatEgp(campaign.goal_amount)} ج
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="rounded-2xl bg-black/30 p-4 backdrop-blur-sm ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="text-2xl font-semibold leading-tight drop-shadow-sm">
                  {campaign.title}
                </div>
                {campaign.description ? (
                  <p className="line-clamp-2 text-sm leading-6 text-white/85">
                    {campaign.description}
                  </p>
                ) : (
                  <p className="text-sm leading-6 text-white/65">تبرع الآن.</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-semibold text-white/70">نسبة الإنجاز</div>
                <div className="text-2xl font-bold text-white">{percent}%</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="absolute inset-0 rounded-full bg-pal-green/85 transition-[width] duration-700 ease-out"
                  style={{ width: `${percent}%` }}
                />
                <div
                  className="progress-shimmer absolute inset-0 opacity-35"
                  aria-hidden
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-sm transition-[left] duration-700 ease-out"
                  style={{
                    left: `clamp(0px, calc(${percent}% - 6px), calc(100% - 6px))`,
                  }}
                  aria-hidden
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
                <div>
                  تم جمع:{" "}
                  <span className="font-semibold text-white">
                    {formatEgp(totalDonated)} ج
                  </span>
                </div>
                <div>
                  الهدف:{" "}
                  <span className="font-semibold text-white">
                    {formatEgp(campaign.goal_amount)} ج
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
