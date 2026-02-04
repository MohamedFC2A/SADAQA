"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

export function CampaignCreator() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");

  const canCreate = useMemo(() => {
    if (state.kind === "saving") return false;
    return slug.trim().length >= 2 && title.trim().length >= 2;
  }, [slug, title, state.kind]);

  async function create() {
    setState({ kind: "saving" });
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug: slug.trim(),
        title: title.trim(),
        min_amount: 10,
        max_amount: 100,
        goal_amount: 10000,
        currency: "EGP",
        is_active: true,
      }),
    });
    if (!res.ok) {
      setState({ kind: "error", message: "تعذر إنشاء الحملة." });
      return;
    }
    setSlug("");
    setTitle("");
    router.refresh();
    setState({ kind: "idle" });
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

