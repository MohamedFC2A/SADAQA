"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

export function CampaignCreator() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("EGP");
  const [minAmount, setMinAmount] = useState<number>(10);
  const [maxAmount, setMaxAmount] = useState<number>(100);
  const [goalAmount, setGoalAmount] = useState<number>(10000);
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [sortRank, setSortRank] = useState<number>(0);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const canCreate = useMemo(() => {
    if (state.kind === "saving") return false;
    return (
      slug.trim().length >= 2 &&
      title.trim().length >= 2 &&
      minAmount > 0 &&
      maxAmount >= minAmount &&
      goalAmount >= 0
    );
  }, [slug, title, state.kind, minAmount, maxAmount, goalAmount]);

  async function create() {
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          title: title.trim(),
          description: description.trim() ? description.trim() : null,
          min_amount: minAmount,
          max_amount: maxAmount,
          goal_amount: goalAmount,
          currency: currency.trim() || "EGP",
          starts_on: startsOn ? startsOn : null,
          ends_on: endsOn ? endsOn : null,
          is_active: isActive,
          is_featured: isFeatured,
          is_new: isNew,
          sort_rank: sortRank,
        }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const message = (() => {
          if (!data || typeof data !== "object") return null;
          const obj = data as Record<string, unknown>;
          const err = obj["error"];
          return typeof err === "string" ? err : null;
        })();
        setState({
          kind: "error",
          message:
            message ?? "تعذر إنشاء الحملة.",
        });
        return;
      }

      const id =
        data && typeof data === "object" && "id" in data
          ? String((data as { id?: unknown }).id ?? "")
          : "";
      if (!id) {
        setState({ kind: "error", message: "تم الإنشاء لكن لم نستلم ID." });
        return;
      }

      if (imageFile) {
        const form = new FormData();
        form.set("image", imageFile);
        await fetch(`/api/admin/campaigns/${id}/image`, { method: "POST", body: form });
      }

      setSlug("");
      setTitle("");
      setDescription("");
      setCurrency("EGP");
      setMinAmount(10);
      setMaxAmount(100);
      setGoalAmount(10000);
      setStartsOn("");
      setEndsOn("");
      setIsActive(true);
      setIsFeatured(false);
      setIsNew(false);
      setSortRank(0);
      setImageFile(null);
      router.push(`/admin/campaigns/${id}`);
      router.refresh();
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error", message: "تعذر إنشاء الحملة." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">إضافة حملة جديدة</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">العنوان</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-3">
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
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={startsOn}
              onChange={(e) => setStartsOn(e.target.value)}
            />
            <button
              type="button"
              className="h-11 whitespace-nowrap rounded-xl border border-border bg-surface-2 px-3 text-xs font-semibold hover:bg-surface-3"
              onClick={() => setStartsOn(new Date().toISOString().slice(0, 10))}
            >
              اليوم
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">نهاية</label>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
            />
            <button
              type="button"
              className="h-11 whitespace-nowrap rounded-xl border border-border bg-surface-2 px-3 text-xs font-semibold hover:bg-surface-3"
              onClick={() => setEndsOn(new Date().toISOString().slice(0, 10))}
            >
              اليوم
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">أولوية الترتيب</label>
          <Input
            type="number"
            value={sortRank}
            onChange={(e) => setSortRank(Number(e.target.value))}
          />
          <div className="text-xs text-muted-foreground">
            رقم أكبر = يظهر أولاً للمستخدمين.
          </div>
        </div>
        <div className="flex items-center gap-4 sm:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            مميز
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
            />
            جديد
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              id="active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            نشط على المنصة
          </label>
        </div>
        <div className="space-y-2 sm:col-span-3">
          <label className="text-sm font-semibold">(اختياري) صورة الحملة</label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
          <div className="text-xs text-muted-foreground">
            يتطلب bucket <span className="font-mono">campaign-images</span> (Public).
          </div>
        </div>
      </div>
      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}
      <Button type="button" onClick={create} disabled={!canCreate}>
        {state.kind === "saving" ? "جارٍ الإنشاء..." : "إنشاء"}
      </Button>
    </div>
  );
}
