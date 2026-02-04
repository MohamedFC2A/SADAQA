"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CAMPAIGN_SLUG = "feed-poor-ramadan";
const MIN = 10;
const MAX = 100;

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: string }
  | { kind: "error"; message: string };

export function DonateCampaign() {
  const [amount, setAmount] = useState<number>(10);
  const [donorName, setDonorName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const isValid = useMemo(() => {
    if (state.kind === "submitting") return false;
    return Number.isFinite(amount) && amount >= MIN && amount <= MAX;
  }, [amount, state.kind]);

  async function submit() {
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignSlug: CAMPAIGN_SLUG,
          amount,
          donorName: donorName.trim() ? donorName.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined,
        }),
      });

      const data = (await res.json()) as unknown;
      if (!res.ok) {
        setState({
          kind: "error",
          message:
            "تعذر تسجيل التبرع حالياً. تأكد من إعداد Supabase والسكيما ثم حاول مرة أخرى.",
        });
        return;
      }

      const id =
        typeof data === "object" && data && "id" in data
          ? String((data as { id?: unknown }).id ?? "")
          : "";
      if (!id) {
        setState({ kind: "error", message: "تم الإرسال لكن لم نستلم رقم التبرع." });
        return;
      }

      setState({ kind: "success", id });
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <Card className="p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">إطعام المساكين</h2>
            <Badge tone="success">حملة نشطة</Badge>
          </div>
          <p className="text-black/70 dark:text-white/70 leading-7">
            تبرع من <span className="font-semibold">10</span> إلى{" "}
            <span className="font-semibold">100</span> جنيه لإطعام المساكين من{" "}
            <span className="font-semibold">2/10</span> حتى{" "}
            <span className="font-semibold">رمضان</span>.
          </p>
        </div>
        <div className="rounded-2xl bg-pal-green/10 px-4 py-3 text-sm font-semibold text-pal-green dark:bg-pal-green/20">
          EGP
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2 sm:col-span-1">
          <label className="text-sm font-semibold">قيمة التبرع (جنيه)</label>
          <Input
            type="number"
            min={MIN}
            max={MAX}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 50, 75, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  amount === v
                    ? "border-pal-green bg-pal-green/10 text-pal-green dark:bg-pal-green/20"
                    : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
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
          <label className="text-sm font-semibold">(اختياري) رقم الهاتف</label>
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
          تم تسجيل التبرع بنجاح. رقم التبرع:{" "}
          <span className="font-mono">{state.id}</span>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" onClick={submit} disabled={!isValid}>
          {state.kind === "submitting" ? "جارٍ الإرسال..." : "تبرع الآن"}
        </Button>
        <div className="text-xs text-black/60 dark:text-white/60">
          هذا تبرع “تسجيل” داخل قاعدة البيانات (بدون دفع إلكتروني حالياً).
        </div>
      </div>
    </Card>
  );
}

