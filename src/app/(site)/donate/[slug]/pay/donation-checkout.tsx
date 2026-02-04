"use client";

import { useMemo, useState } from "react";
import { paymentConfig } from "@/lib/payments/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Campaign = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  min_amount: number;
  max_amount: number;
  goal_amount: number;
  is_active: boolean;
};

type PaymentMethod = "vodafone_cash" | "bank_transfer" | "whatsapp" | "other";

type State =
  | { kind: "idle" }
  | { kind: "creating" }
  | { kind: "ready"; id: string; paymentCode: string }
  | { kind: "error"; message: string };

function formatEgp(amount: number) {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(
    amount,
  );
}

function getWhatsappUrl(message: string) {
  const text = encodeURIComponent(message);
  return `https://wa.me/${paymentConfig.whatsappAdminNumber}?text=${text}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore (clipboard may be unavailable on non-secure contexts)
  }
}

export function DonationCheckout({ campaign }: { campaign: Campaign }) {
  const [amount, setAmount] = useState<number>(campaign.min_amount);
  const [donorName, setDonorName] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("vodafone_cash");
  const [state, setState] = useState<State>({ kind: "idle" });

  const quickAmounts = useMemo(() => {
    const preferred = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    return preferred.filter(
      (v) => v >= campaign.min_amount && v <= campaign.max_amount,
    );
  }, [campaign.min_amount, campaign.max_amount]);

  const amountOk =
    Number.isFinite(amount) &&
    amount >= campaign.min_amount &&
    amount <= campaign.max_amount;

  const canCreate = state.kind !== "creating" && amountOk;

  const whatsappMessage = useMemo(() => {
    if (state.kind !== "ready") return "";
    const donor = donorName.trim() ? donorName.trim() : "-";
    const tel = phone.trim() ? phone.trim() : "-";
    return [
      "السلام عليكم،",
      "أريد تأكيد تبرع جديد:",
      `كود الدفع: ${state.paymentCode}`,
      `الحملة: ${campaign.title}`,
      `المبلغ: ${formatEgp(amount)} ${campaign.currency}`,
      `الاسم: ${donor}`,
      `الهاتف: ${tel}`,
      "سأرسل إيصال التحويل هنا.",
    ].join("\n");
  }, [
    state,
    donorName,
    phone,
    campaign.title,
    campaign.currency,
    amount,
  ]);

  async function createPayment() {
    if (!canCreate) return;
    setState({ kind: "creating" });
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          amount,
          donorName: donorName.trim() ? donorName.trim() : undefined,
          phone: phone.trim() ? phone.trim() : undefined,
          paymentMethod: method,
        }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok || !data || typeof data !== "object") {
        setState({
          kind: "error",
          message: "تعذر إنشاء كود الدفع حالياً. حاول مرة أخرى.",
        });
        return;
      }
      const obj = data as Record<string, unknown>;
      const id = typeof obj["id"] === "string" ? obj["id"] : String(obj["id"] ?? "");
      const paymentCode =
        typeof obj["paymentCode"] === "string"
          ? obj["paymentCode"]
          : String(obj["paymentCode"] ?? "");

      if (!id || !paymentCode) {
        const error = typeof obj["error"] === "string" ? obj["error"] : null;
        setState({
          kind: "error",
          message:
            error === "SCHEMA_OUTDATED"
              ? "قاعدة البيانات غير محدثة. شغّل supabase/schema.sql داخل Supabase SQL Editor ثم أعد المحاولة."
              : "تم الإرسال لكن لم نستلم كود الدفع. حاول مرة أخرى.",
        });
        return;
      }

      setState({ kind: "ready", id, paymentCode });
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <div className="space-y-5">
          <div className="space-y-1">
            <div className="text-xl font-semibold">بيانات التبرع</div>
            <div className="text-sm text-black/60 dark:text-white/60">
              من {formatEgp(campaign.min_amount)} إلى {formatEgp(campaign.max_amount)}{" "}
              {campaign.currency}
            </div>
          </div>

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
              {!amountOk ? (
                <div className="text-xs text-pal-red">
                  اختر مبلغاً بين {formatEgp(campaign.min_amount)} و{" "}
                  {formatEgp(campaign.max_amount)}.
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">(اختياري) الاسم</label>
              <Input
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="مثال: محمد"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">(اختياري) الهاتف</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01xxxxxxxxx"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">طريقة الدفع</label>
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              <option value="vodafone_cash">Vodafone Cash</option>
              <option value="bank_transfer">تحويل</option>
              <option value="whatsapp">تنسيق عبر واتساب</option>
              <option value="other">أخرى</option>
            </Select>
          </div>

          {state.kind === "error" ? (
            <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
              {state.message}
            </div>
          ) : null}

          {state.kind === "ready" ? (
            <div className="space-y-3 rounded-2xl border border-pal-green/30 bg-pal-green/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-pal-green">
                    تم إنشاء كود الدفع
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-black dark:text-white">
                    {state.paymentCode}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-semibold hover:bg-black/5 dark:border-white/15 dark:bg-black dark:hover:bg-white/10"
                    onClick={() => copy(state.paymentCode)}
                  >
                    نسخ الكود
                  </button>
                  <a
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-pal-green px-5 text-sm font-semibold text-white hover:bg-pal-green/90"
                    href={getWhatsappUrl(whatsappMessage)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    فتح واتساب برسالة جاهزة
                  </a>
                </div>
              </div>
              <div className="text-xs text-black/60 dark:text-white/60">
                احتفظ بالكود، ثم أرسل رسالة واتساب للأدمن لإتمام التحقق.
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" onClick={createPayment} disabled={!canCreate} className="sm:w-auto">
              {state.kind === "creating" ? "جارٍ إنشاء الكود..." : "إنشاء كود الدفع"}
            </Button>
            <div className="text-xs text-black/60 dark:text-white/60">
              فوري و InstaPay <span className="font-semibold">مغلقة الآن</span>.
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Vodafone Cash</div>
            <Badge tone="success">متاح (مؤقت)</Badge>
          </div>
          <div className="space-y-1 text-sm text-black/70 dark:text-white/70">
            <div>
              الاسم: <span className="font-semibold">{paymentConfig.vodafoneCash.recipientName}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono">{paymentConfig.vodafoneCash.number}</span>
              <button
                type="button"
                className="rounded-xl border border-black/15 bg-white px-3 py-2 text-xs font-semibold hover:bg-black/5 dark:border-white/15 dark:bg-black dark:hover:bg-white/10"
                onClick={() => copy(paymentConfig.vodafoneCash.number)}
              >
                نسخ
              </button>
            </div>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60">
            بعد التحويل أرسل إيصال الدفع على واتساب مع كود الدفع.
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">تحويل</div>
            <Badge tone="success">متاح</Badge>
          </div>
          <div className="text-sm text-black/70 dark:text-white/70">
            {paymentConfig.bankTransferHint}
          </div>
          <a
            className="inline-flex h-11 items-center justify-center rounded-xl bg-pal-green px-5 text-sm font-semibold text-white hover:bg-pal-green/90"
            href={getWhatsappUrl("السلام عليكم، أريد بيانات التحويل لإتمام التبرع.")}
            target="_blank"
            rel="noreferrer"
          >
            تواصل عبر واتساب
          </a>
        </Card>

        <Card className="p-6 space-y-3 opacity-70">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">Fawry</div>
            <Badge tone="warning">مغلق الآن</Badge>
          </div>
          <div className="text-sm text-black/60 dark:text-white/60">
            سيتم تفعيل فوري قريباً.
          </div>
          <button
            type="button"
            className="h-11 w-full rounded-xl border border-black/15 bg-white text-sm font-semibold text-black/40 dark:border-white/15 dark:bg-black dark:text-white/40"
            disabled
          >
            قريباً
          </button>
        </Card>

        <Card className="p-6 space-y-3 opacity-70">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">InstaPay</div>
            <Badge tone="warning">مغلق الآن</Badge>
          </div>
          <div className="text-sm text-black/60 dark:text-white/60">
            سيتم تفعيل InstaPay قريباً.
          </div>
          <button
            type="button"
            className="h-11 w-full rounded-xl border border-black/15 bg-white text-sm font-semibold text-black/40 dark:border-white/15 dark:bg-black dark:text-white/40"
            disabled
          >
            قريباً
          </button>
        </Card>
      </div>
    </div>
  );
}
