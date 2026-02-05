"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import {
  requestTypeLabelAr,
  statusLabelAr as requestStatusLabelAr,
  urgencyLabelAr,
} from "@/lib/requests/constants";

type Profile = {
  id: string;
  name: string;
  phone: string | null;
  isAnonymous: boolean;
  createdAt: string | null;
};

type RequestItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  urgency: string;
  createdAt: string;
  isAnonymous: boolean;
};

type DonationItem = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentCode: string | null;
  createdAt: string;
  isAnonymous: boolean;
};

const donationStatusLabel: Record<string, string> = {
  pending: "قيد المراجعة",
  proof_sent: "بانتظار تأكيد الإيصال",
  verified: "تم التحقق",
  canceled: "ملغي",
};

const donationStatusTone: Record<string, "neutral" | "success" | "danger" | "warning"> =
  {
    pending: "warning",
    proof_sent: "warning",
    verified: "success",
    canceled: "danger",
  };

const paymentMethodLabel: Record<string, string> = {
  vodafone_cash: "Vodafone Cash",
  bank_transfer: "تحويل بنكي",
  whatsapp: "تنسيق واتساب",
  other: "طريقة أخرى",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAmount(amount: number, currency: string) {
  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(amount)} ${currency}`;
}

function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  return <Badge tone={tone}>{label}</Badge>;
}

function ActivityToggle({
  active,
  onChange,
}: {
  active: "requests" | "donations";
  onChange: (tab: "requests" | "donations") => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-black/10 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-black">
      {[
        { key: "requests", label: "طلبات المساعدة" },
        { key: "donations", label: "تبرعاتي" },
      ].map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key as "requests" | "donations")}
          className={cn(
            "relative min-w-[140px] rounded-xl px-4 py-2 text-sm font-semibold transition-all",
            active === tab.key
              ? "bg-pal-green text-white shadow-sm"
              : "text-black/70 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/10",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type Props = {
  profile: Profile;
  requests: RequestItem[];
  donations: DonationItem[];
  warnings: string[];
};

export function ProfileClient({ profile, requests, donations, warnings }: Props) {
  const [name, setName] = useState(profile.name);
  const [isAnonymous, setIsAnonymous] = useState(profile.isAnonymous);
  const [baseProfile, setBaseProfile] = useState(profile);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [activeTab, setActiveTab] = useState<"requests" | "donations">("requests");

  const isDirty =
    name.trim() !== baseProfile.name.trim() || isAnonymous !== baseProfile.isAnonymous;

  const nameOk = name.trim().length >= 2;

  const activity = activeTab === "requests" ? requests : donations;

  async function saveProfile() {
    if (!isDirty || !nameOk || saveState === "saving") return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), isAnonymous }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok || !data || typeof data !== "object") {
        setSaveState("error");
        return;
      }
      const profileObj = (data as { profile?: Profile }).profile;
      if (profileObj) {
        setBaseProfile(profileObj);
        setName(profileObj.name);
        setIsAnonymous(profileObj.isAnonymous);
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1600);
    } catch {
      setSaveState("error");
    }
  }

  const anonymousHint = useMemo(() => {
    if (isAnonymous) {
      return "سيتم استخدام اسم \"مجهول\" بشكل تلقائي عند إرسال تبرع أو طلب مساعدة من حسابك.";
    }
    return "سيظهر اسم حسابك في الطلبات والتبرعات ما لم تختر الإخفاء يدوياً.";
  }, [isAnonymous]);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-br from-pal-green/15 via-white to-pal-gold/10 p-8 shadow-sm dark:border-white/10 dark:from-pal-green/10 dark:via-black dark:to-pal-gold/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(20,153,84,.25),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(228,49,43,.18),transparent_40%),radial-gradient(circle_at_50%_120%,rgba(212,175,55,.25),transparent_45%)]" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-black shadow-sm backdrop-blur dark:bg-white/10 dark:text-white">
              <span className="h-2 w-2 rounded-full bg-pal-red" />
              <span className="h-2 w-2 rounded-full bg-pal-black dark:bg-white" />
              <span className="h-2 w-2 rounded-full bg-pal-green" />
              <span className="h-2 w-2 rounded-full bg-pal-gold" />
              <span className="mr-2">ملفك الشخصي</span>
            </div>
            {profile.createdAt ? (
              <Badge tone="neutral">منذ {formatDate(profile.createdAt)}</Badge>
            ) : null}
            <Badge tone={isAnonymous ? "warning" : "success"}>
              {isAnonymous ? "الوضع المجهول مفعل" : "الظهور بالاسم مفعل"}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              أهلاً {baseProfile.name || "صديقنا"} 👋
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-black/70 dark:text-white/70">
              هنا يمكنك إدارة اسم حسابك، تفعيل الوضع المجهول، ومراجعة كل ما أرسلته من
              تبرعات أو طلبات مساعدة في مكان واحد.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge label={anonymousHint} tone={isAnonymous ? "warning" : "neutral"} />
            {baseProfile.phone ? (
              <Badge tone="neutral">هاتف: {baseProfile.phone}</Badge>
            ) : (
              <Badge tone="neutral">أضف رقم هاتف من لوحة الدعم لاحقاً</Badge>
            )}
          </div>
        </div>
      </section>

      {warnings.length > 0 ? (
        <Card className="space-y-2 border border-pal-gold/40 bg-pal-gold/10 p-4">
          <div className="text-sm font-semibold text-pal-gold">تنبيه</div>
          <ul className="list-disc space-y-1 pr-5 text-sm text-black/80 dark:text-white/80">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xl font-semibold">إعدادات الحساب</div>
              <div className="text-sm text-black/60 dark:text-white/60">
                عدّل اسمك أو فعّل إخفاء الهوية للتبرعات وطلبات المساعدة.
              </div>
            </div>
            <Button onClick={saveProfile} disabled={!isDirty || !nameOk || saveState === "saving"}>
              {saveState === "saving"
                ? "جاري الحفظ..."
                : saveState === "saved"
                  ? "تم الحفظ"
                  : "حفظ التغييرات"}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-semibold">اسم الحساب</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أحمد عبد الرحمن"
              />
              {!nameOk ? (
                <div className="text-xs text-pal-red">الاسم يجب أن يكون حرفين على الأقل.</div>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">الوضع المجهول</label>
              <button
                type="button"
                onClick={() => setIsAnonymous((v) => !v)}
                className={cn(
                  "flex h-11 items-center justify-between rounded-2xl border px-3 text-sm font-semibold transition-all",
                  isAnonymous
                    ? "border-pal-green/50 bg-pal-green/10 text-pal-green dark:bg-pal-green/20"
                    : "border-black/15 bg-white text-black/70 hover:bg-black/5 dark:border-white/15 dark:bg-black dark:text-white/70 dark:hover:bg-white/10",
                )}
              >
                <span>{isAnonymous ? "مفعل" : "مغلق"}</span>
                <span
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full bg-black/10 transition-all dark:bg-white/15",
                    isAnonymous ? "pl-5 bg-pal-green/60" : "pl-1",
                  )}
                >
                  <span className="h-4 w-4 rounded-full bg-white shadow-sm dark:bg-black" />
                </span>
              </button>
              <p className="text-xs text-black/60 dark:text-white/60">{anonymousHint}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="text-sm font-semibold">نصائح للخصوصية</div>
          <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
            <li>• يمكنك تفعيل الوضع المجهول ثم إيقافه لاحقاً دون فقدان نشاطك.</li>
            <li>• الطلبات والتبرعات القديمة تظل محفوظة ولكن قد تظهر بالاسم الذي أرسلته وقتها.</li>
            <li>• احتفظ برقم الطلب أو كود الدفع لتتبع حالته بسرعة.</li>
          </ul>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-xl font-semibold">نشاطك</div>
            <div className="text-sm text-black/60 dark:text-white/60">
              بدّل بين طلبات المساعدة والتبرعات لمعرفة حالتها.
            </div>
          </div>
          <ActivityToggle active={activeTab} onChange={setActiveTab} />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/10 bg-black/5 px-6 py-10 text-center dark:border-white/10 dark:bg-white/5">
              <div className="text-lg font-semibold">
                {activeTab === "requests"
                  ? "لا توجد طلبات مساعدة مرتبطة بحسابك بعد."
                  : "لا توجد تبرعات مسجلة بحسابك بعد."}
              </div>
              <div className="mt-2 text-sm text-black/60 dark:text-white/60">
                {activeTab === "requests"
                  ? "قدّم طلب مساعدة جديد أو تابع حالة الطلبات عبر الكود."
                  : "ابدأ تبرعاً الآن وسنربطه بحسابك تلقائياً."}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {activeTab === "requests" ? (
                  <>
                    <ButtonLink href="/request-help">طلب مساعدة</ButtonLink>
                    <ButtonLink href="/request-help/status" variant="secondary">
                      تتبع طلب
                    </ButtonLink>
                  </>
                ) : (
                  <ButtonLink href="/donate" variant="primary">
                    ابدأ تبرع جديد
                  </ButtonLink>
                )}
              </div>
            </div>
          ) : activeTab === "requests" ? (
            requests.map((req) => (
              <Card
                key={req.id}
                className="relative overflow-hidden border border-black/10 bg-white/80 p-4 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-black/60"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pal-green to-pal-gold" />
                <div className="flex flex-wrap items-start justify-between gap-3 ps-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">
                        {req.isAnonymous ? "مجهول" : req.name}
                      </div>
                      <Badge tone="neutral">{requestTypeLabelAr[req.type as keyof typeof requestTypeLabelAr] ?? req.type}</Badge>
                      <Badge tone="warning">{urgencyLabelAr[req.urgency as keyof typeof urgencyLabelAr] ?? req.urgency}</Badge>
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      أُرسل في {formatDate(req.createdAt)}
                    </div>
                  </div>
                  <StatusBadge
                    label={requestStatusLabelAr[req.status as keyof typeof requestStatusLabelAr] ?? req.status}
                    tone={
                      req.status === "approved"
                        ? "success"
                        : req.status === "rejected"
                          ? "danger"
                          : req.status === "completed"
                            ? "neutral"
                            : "warning"
                    }
                  />
                </div>
              </Card>
            ))
          ) : (
            donations.map((donation) => (
              <Card
                key={donation.id}
                className="relative overflow-hidden border border-black/10 bg-white/80 p-4 transition-shadow hover:shadow-md dark:border-white/10 dark:bg-black/60"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-pal-red to-pal-gold" />
                <div className="flex flex-wrap items-start justify-between gap-3 ps-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold">
                        {donation.isAnonymous ? "مجهول" : baseProfile.name || "—"}
                      </div>
                      <Badge tone="neutral">
                        {formatAmount(donation.amount, donation.currency)}
                      </Badge>
                      {donation.paymentMethod ? (
                        <Badge tone="neutral">
                          {paymentMethodLabel[donation.paymentMethod] ??
                            donation.paymentMethod}
                        </Badge>
                      ) : null}
                      {donation.paymentCode ? (
                        <Badge tone="neutral">كود: {donation.paymentCode}</Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      أُرسل في {formatDate(donation.createdAt)}
                    </div>
                  </div>
                  <StatusBadge
                    label={
                      donationStatusLabel[donation.status] ?? donation.status
                    }
                    tone={donationStatusTone[donation.status] ?? "neutral"}
                  />
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 space-y-2">
          <div className="text-sm font-semibold">لماذا الوضع المجهول؟</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            نحترم خصوصيتك. تفعيل الإخفاء يجعل اسمك يظهر كمجهول في التبرعات والطلبات
            الجديدة، مع بقاء بيانات التواصل محفوظة للإدارة فقط.
          </div>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="text-sm font-semibold">تتبع سريع</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            احتفظ برقم الطلب أو كود الدفع. يمكنك دائماً استخدام صفحة التتبع أو مراسلة
            الأدمن عبر واتساب لتأكيد التحويل.
          </div>
        </Card>
        <Card className="p-5 space-y-2">
          <div className="text-sm font-semibold">دعم مباشر</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            في حال وجود مشكلة في حالة الدفع أو الطلب، راسلنا من صفحة التواصل وسنساعدك
            سريعاً.
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-black/10 bg-gradient-to-l from-pal-black via-pal-red/80 to-pal-green/80 px-6 py-5 text-white dark:border-white/10">
        <div className="space-y-1">
          <div className="text-lg font-semibold">جاهز لبدء خطوة جديدة؟</div>
          <div className="text-sm text-white/85">
            يمكنك إرسال طلب مساعدة أو دعم حملة قائمة، مع الحفاظ على خصوصيتك.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-pal-black shadow-sm transition hover:translate-y-[-1px] hover:shadow-md"
            href="/donate"
          >
            تبرع الآن
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
            href="/request-help"
          >
            طلب مساعدة
          </Link>
        </div>
      </div>
    </div>
  );
}
