"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  min_amount: number;
  max_amount: number;
  goal_amount: number;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function CampaignEditor({ campaign }: { campaign: CampaignRow }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [slug, setSlug] = useState(campaign.slug);
  const [title, setTitle] = useState(campaign.title);
  const [description, setDescription] = useState(campaign.description ?? "");
  const [currency, setCurrency] = useState(campaign.currency);
  const [minAmount, setMinAmount] = useState<number>(campaign.min_amount);
  const [maxAmount, setMaxAmount] = useState<number>(campaign.max_amount);
  const [goalAmount, setGoalAmount] = useState<number>(campaign.goal_amount);
  const [startsOn, setStartsOn] = useState(campaign.starts_on ?? "");
  const [endsOn, setEndsOn] = useState(campaign.ends_on ?? "");
  const [isActive, setIsActive] = useState<boolean>(campaign.is_active);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const changed = useMemo(() => {
    return (
      slug !== campaign.slug ||
      title !== campaign.title ||
      description !== (campaign.description ?? "") ||
      currency !== campaign.currency ||
      minAmount !== campaign.min_amount ||
      maxAmount !== campaign.max_amount ||
      goalAmount !== campaign.goal_amount ||
      startsOn !== (campaign.starts_on ?? "") ||
      endsOn !== (campaign.ends_on ?? "") ||
      isActive !== campaign.is_active
    );
  }, [
    slug,
    title,
    description,
    currency,
    minAmount,
    maxAmount,
    goalAmount,
    startsOn,
    endsOn,
    isActive,
    campaign,
  ]);

  async function save() {
    setState({ kind: "saving" });
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          currency: currency.trim(),
          min_amount: minAmount,
          max_amount: maxAmount,
          goal_amount: goalAmount,
          starts_on: startsOn ? startsOn : null,
          ends_on: endsOn ? endsOn : null,
          is_active: isActive,
        }),
      });
      if (!res.ok) {
        setState({ kind: "error", message: "تعذر حفظ التغييرات." });
        return;
      }
      setState({ kind: "saved" });
      router.refresh();
      setTimeout(() => setState({ kind: "idle" }), 1200);
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  async function uploadImage() {
    if (!imageFile) return;
    setState({ kind: "saving" });
    const form = new FormData();
    form.set("image", imageFile);
    const res = await fetch(`/api/admin/campaigns/${campaign.id}/image`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      setState({ kind: "error", message: "تعذر رفع الصورة." });
      return;
    }
    setImageFile(null);
    setState({ kind: "saved" });
    router.refresh();
    setTimeout(() => setState({ kind: "idle" }), 1200);
  }

  async function removeCampaign() {
    const ok = window.confirm("هل تريد حذف الحملة نهائياً؟ سيتم حذفها من المنصة.");
    if (!ok) return;
    setState({ kind: "saving" });
    const res = await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setState({ kind: "error", message: "تعذر حذف الحملة." });
      return;
    }
    window.location.href = "/admin/campaigns";
  }

  async function clearImage() {
    setState({ kind: "saving" });
    const res = await fetch(`/api/admin/campaigns/${campaign.id}/image`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setState({ kind: "error", message: "تعذر حذف الصورة." });
      return;
    }
    setState({ kind: "saved" });
    router.refresh();
    setTimeout(() => setState({ kind: "idle" }), 1200);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold">إعدادات الحملة</div>
        <button
          type="button"
          onClick={removeCampaign}
          className="text-sm font-semibold text-pal-red hover:underline"
        >
          حذف الحملة
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">العنوان</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">الوصف</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">العملة</label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الهدف</label>
          <Input
            type="number"
            min={0}
            value={goalAmount}
            onChange={(e) => setGoalAmount(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الحد الأدنى</label>
          <Input
            type="number"
            min={1}
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الحد الأقصى</label>
          <Input
            type="number"
            min={1}
            value={maxAmount}
            onChange={(e) => setMaxAmount(Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">بداية</label>
          <Input
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">نهاية</label>
          <Input
            type="date"
            value={endsOn}
            onChange={(e) => setEndsOn(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label htmlFor="isActive" className="text-sm font-semibold">
            نشط على المنصة
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">صورة الحملة</div>
        {campaign.image_url ? (
          <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <div className="relative h-40 w-full">
              <Image
                src={campaign.image_url}
                alt="صورة الحملة"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex items-center justify-between gap-2 p-3">
              <div className="truncate text-xs text-black/60 dark:text-white/60">
                {campaign.image_url}
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="text-xs font-semibold text-pal-red hover:underline"
              >
                حذف الصورة
              </button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-black/60 dark:text-white/60">
            لا توجد صورة.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={uploadImage}
            disabled={!imageFile || state.kind === "saving"}
          >
            رفع صورة
          </Button>
        </div>
        <div className="text-xs text-black/60 dark:text-white/60">
          يتطلب إنشاء Supabase Storage bucket باسم <span className="font-mono">campaign-images</span> (Public).
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}
      {state.kind === "saved" ? (
        <div className="rounded-xl border border-pal-green/30 bg-pal-green/10 p-3 text-sm text-pal-green">
          تم الحفظ
        </div>
      ) : null}

      <Button
        type="button"
        onClick={save}
        disabled={!changed || state.kind === "saving"}
        className="w-full"
      >
        {state.kind === "saving" ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </Button>
    </div>
  );
}

