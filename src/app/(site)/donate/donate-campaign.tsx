"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DonationCampaign } from "@/lib/donations/types";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: string }
  | { kind: "error"; message: string };

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
  const [amount, setAmount] = useState<number>(campaign.min_amount);
  const [donorName, setDonorName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const progress = clamp01(
    campaign.goal_amount > 0 ? totalDonated / campaign.goal_amount : 0,
  );
  const remaining = Math.max(0, campaign.goal_amount - totalDonated);

  const quickAmounts = useMemo(() => {
    const preferred = [10, 20, 50, 100, 500, 1000, 2000];
    return preferred.filter(
      (v) => v >= campaign.min_amount && v <= campaign.max_amount,
    );
  }, [campaign.min_amount, campaign.max_amount]);

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    if (!Number.isFinite(amount)) return false;
    return amount >= campaign.min_amount && amount <= campaign.max_amount;
  }, [amount, campaign.max_amount, campaign.min_amount, state.kind]);

  async function submit() {
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          amount,
          donorName: donorName.trim() ? donorName.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined,
        }),
      });
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        setState({
          kind: "error",
          message: "تعذر تسجيل التبرع. تأكد من إعداد Supabase والسكيما.",
        });
        return;
      }

      const id =
        typeof data === "object" && data && "id" in data
          ? String((data as { id?: unknown }).id ?? "")
          : "";

      if (!id) {
        setState({
          kind: "error",
          message: "تم الإرسال لكن لم نستلم رقم التبرع.",
        });
        return;
      }

      setState({ kind: "success", id });
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div
          className="h-44 w-full bg-cover bg-center"
          style={{
            backgroundImage: `url(${campaign.image_url ?? "/images/donate-hero.jpg"})`,
            filter: "blur(10px)",
            transform: "scale(1.12)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,.65),rgba(0,0,0,.35),rgba(0,0,0,.8))]" />

        <div className="absolute inset-x-0 top-0 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold text-white">
                  {campaign.title}
                </div>
                <Badge tone="success">نشط</Badge>
              </div>
              <div className="max-w-2xl text-sm leading-6 text-white/80">
                {campaign.description}
              </div>
            </div>
            <div className="rounded-2xl bg-pal-green/15 px-4 py-2 text-sm font-semibold text-white">
              {campaign.currency}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="font-brand text-4xl font-bold tracking-wide text-white drop-shadow">
              {formatEgp(amount)} ج
            </div>
            <div className="mt-1 text-xs font-semibold text-white/75">
              اختر قيمة التبرع
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
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
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setAmount(v)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                amount === v
                  ? "border-pal-green bg-pal-green/10 text-pal-green dark:bg-pal-green/20"
                  : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
              }`}
            >
              {formatEgp(v)} ج
            </button>
          ))}
          <div className="mr-auto flex items-center gap-2">
            <div className="text-xs text-black/60 dark:text-white/60">
              من {formatEgp(campaign.min_amount)} إلى{" "}
              {formatEgp(campaign.max_amount)} ج
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-semibold">قيمة التبرع</label>
            <Input
              type="number"
              min={campaign.min_amount}
              max={campaign.max_amount}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">(اختياري) الاسم</label>
            <Input
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="مثال: محمد"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold">(اختياري) الهاتف</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 01xxxxxxxxx"
              inputMode="tel"
            />
          </div>
        </div>

        {state.kind === "error" ? (
          <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
            {state.message}
          </div>
        ) : null}
        {state.kind === "success" ? (
          <div className="rounded-xl border border-pal-green/30 bg-pal-green/10 p-3 text-sm text-pal-green">
            تم تسجيل التبرع. رقم العملية:{" "}
            <span className="font-mono">{state.id}</span>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" onClick={submit} disabled={!canSubmit}>
            {state.kind === "submitting" ? "جارٍ الإرسال..." : "تبرع الآن"}
          </Button>
          <div className="text-xs text-black/60 dark:text-white/60">
            هذا تسجيل تبرع داخل قاعدة البيانات (بدون دفع إلكتروني حالياً).
          </div>
        </div>
      </div>
    </Card>
  );
}

