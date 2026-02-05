"use client";

import { useMemo, useState } from "react";
import type { DonationCampaign } from "@/lib/donations/types";
import { DonateCampaign } from "@/app/(site)/donate/donate-campaign";
import { Select } from "@/components/ui/select";

type CampaignWithTotal = {
  campaign: DonationCampaign;
  totalDonated: number;
};

type SortKey = "default" | "ending" | "newest" | "progress";

function toTime(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.getTime();
}

function clamp01(x: number) {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function progressFor(c: DonationCampaign, total: number) {
  return clamp01(c.goal_amount > 0 ? total / c.goal_amount : 0);
}

export function DonationsGridClient({
  items,
}: {
  items: CampaignWithTotal[];
}) {
  const [sort, setSort] = useState<SortKey>("default");

  const sorted = useMemo(() => {
    const copy = [...items];

    if (sort === "default") {
      copy.sort((a, b) => {
        if (a.campaign.is_featured !== b.campaign.is_featured) {
          return a.campaign.is_featured ? -1 : 1;
        }
        if (a.campaign.sort_rank !== b.campaign.sort_rank) {
          return b.campaign.sort_rank - a.campaign.sort_rank;
        }
        const at = toTime(a.campaign.created_at);
        const bt = toTime(b.campaign.created_at);
        return (bt ?? 0) - (at ?? 0);
      });
      return copy;
    }

    if (sort === "ending") {
      copy.sort((a, b) => {
        const ae = toTime(a.campaign.ends_on);
        const be = toTime(b.campaign.ends_on);
        if (ae === null && be === null) return 0;
        if (ae === null) return 1;
        if (be === null) return -1;
        return ae - be;
      });
      return copy;
    }

    if (sort === "newest") {
      copy.sort((a, b) => {
        const at = toTime(a.campaign.created_at);
        const bt = toTime(b.campaign.created_at);
        return (bt ?? 0) - (at ?? 0);
      });
      return copy;
    }

    // progress
    copy.sort((a, b) => {
      const ap = progressFor(a.campaign, a.totalDonated);
      const bp = progressFor(b.campaign, b.totalDonated);
      return bp - ap;
    });
    return copy;
  }, [items, sort]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-xl font-semibold">اختر حملة وتبرع فوراً</div>
          <div className="text-sm text-muted-foreground">
            يمكنك ترتيب الحملات حسب الأقرب للانتهاء أو الأحدث أو الأقرب لاكتمال الهدف.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold">الترتيب</label>
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="min-w-[220px]"
          >
            <option value="default">الافتراضي (حسب الأدمن)</option>
            <option value="ending">الأقرب للانتهاء</option>
            <option value="newest">الأحدث</option>
            <option value="progress">الأقرب لاكتمال الهدف</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((x) => (
          <DonateCampaign
            key={x.campaign.id}
            campaign={x.campaign}
            totalDonated={x.totalDonated}
          />
        ))}
      </div>
    </div>
  );
}
