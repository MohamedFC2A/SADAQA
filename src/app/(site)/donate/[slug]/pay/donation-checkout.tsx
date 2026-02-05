"use client";

import { useMemo, useState } from "react";
import { paymentConfig } from "@/lib/payments/config";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

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
  const [state, setState] = useState<State>({ kind: "idle" });

  const currencyLabel = campaign.currency === "EGP" ? "ج" : campaign.currency;

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
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const adminLink = origin ? `${origin}/admin/donations/${state.id}` : "";
    return [
      "السلام عليكم،",
      "أريد تأكيد تبرع (محفظة / واتساب):",
      `كود الدفع: ${state.paymentCode}`,
      `الحملة: ${campaign.title}`,
      `المبلغ: ${formatEgp(amount)} ${currencyLabel}`,
      `الاسم: ${donor}`,
      `الهاتف: ${tel}`,
      adminLink ? `رابط الأدمن: ${adminLink}` : "",
      "سأرسل صورة إيصال الدفع هنا.",
    ]
      .filter((line) => Boolean(line))
      .join("\n");
  }, [
    state,
    donorName,
    phone,
    campaign.title,
    currencyLabel,
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
          paymentMethod: "whatsapp",
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
            <div className="text-sm text-muted-foreground">
              من {formatEgp(campaign.min_amount)} إلى {formatEgp(campaign.max_amount)}{" "}
              {currencyLabel}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${amount === v
                    ? "border-pal-green bg-pal-green/10 text-pal-green dark:bg-pal-green/20"
                    : "border-border hover:bg-surface-2"
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

          <div className="rounded-2xl border border-pal-green/20 bg-pal-green/10 p-4 text-sm text-muted-foreground">
            <div className="font-semibold text-pal-green">طريقة الدفع المتاحة الآن</div>
            <div className="mt-1">
              الدفع يتم عبر <span className="font-semibold">محفظة / واتساب</span> (نفس
              الطريقة): أنشئ كود الدفع ثم أرسل رسالة واتساب للأدمن مع الإيصال.
            </div>
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
                  <div className="mt-1 font-mono text-lg font-bold text-foreground">
                    {state.paymentCode}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-border bg-surface-2 px-4 py-2 text-sm font-semibold hover:bg-surface-3"
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
              <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-surface/60 p-3">
                  <div className="font-semibold">1) حوّل من المحفظة</div>
                  <div className="mt-1">
                    حوّل المبلغ من محفظتك لأي رقم/جهة يحددها الأدمن.
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/60 p-3">
                  <div className="font-semibold">2) أرسل الإيصال</div>
                  <div className="mt-1">
                    افتح واتساب بالزر وأرسل صورة الإيصال مع كود الدفع.
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface/60 p-3">
                  <div className="font-semibold">3) يتم التحقق</div>
                  <div className="mt-1">
                    بعد المراجعة ستتحول الحالة إلى “verified” داخل لوحة الأدمن.
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" onClick={createPayment} disabled={!canCreate} className="sm:w-auto">
              {state.kind === "creating" ? "جارٍ إنشاء الكود..." : "إنشاء كود الدفع"}
            </Button>
            <div className="text-xs text-muted-foreground">
              ملاحظة: طرق الدفع الأخرى ستُفعّل لاحقاً بشكل رسمي داخل المنصة.
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold">طرق الدفع</div>
            <Badge tone="success">متاح الآن: واتساب</Badge>
          </div>

          <div className="space-y-2">
            <div className="rounded-2xl border border-border bg-pal-green/15 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-pal-green">
                  محفظة / واتساب
                </div>
                <div className="rounded-full bg-pal-green px-3 py-1 text-xs font-semibold text-white">
                  متاح
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                أنشئ كود الدفع ثم افتح واتساب برسالة جاهزة لإرسال الإيصال.
              </div>
              <a
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-pal-green px-5 text-sm font-semibold text-white hover:bg-pal-green/90"
                href={getWhatsappUrl("السلام عليكم، أريد إتمام تبرع عبر محفظة/واتساب. برجاء إرسال بيانات التحويل.")}
                target="_blank"
                rel="noreferrer"
              >
                اطلب بيانات الدفع على واتساب
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-red-600/85 px-4 py-3 text-white opacity-80">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">Vodafone Cash</div>
                <div className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  قريباً
                </div>
              </div>
              <div className="mt-1 text-xs text-white/85">
                سيتم تفعيله داخل المنصة قريباً.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-slate-900/80 px-4 py-3 text-white opacity-80">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">تحويل بنكي</div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                  قريباً
                </div>
              </div>
              <div className="mt-1 text-xs text-white/80">
                سيتم تفعيله داخل المنصة قريباً.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-yellow-300/85 px-4 py-3 opacity-80">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-sky-700">Fawry</div>
                <div className="rounded-full bg-black/10 px-3 py-1 text-xs font-semibold text-sky-700">
                  قريباً
                </div>
              </div>
              <div className="mt-1 text-xs text-sky-700/90">
                سيتم تفعيله داخل المنصة قريباً.
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-purple-600/85 px-4 py-3 opacity-80">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-orange-200">InstaPay</div>
                <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-orange-200">
                  قريباً
                </div>
              </div>
              <div className="mt-1 text-xs text-orange-200/90">
                سيتم تفعيله داخل المنصة قريباً.
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            حالياً نتواصل عبر واتساب فقط لتجميع البيانات بسرعة وبأمان.
          </div>
        </Card>
      </div>
    </div>
  );
}
