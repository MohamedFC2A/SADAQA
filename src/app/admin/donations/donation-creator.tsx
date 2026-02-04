"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type CampaignRow = { id: string; title: string; slug: string; currency: string };

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

export function DonationCreator({ campaigns }: { campaigns: CampaignRow[] }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? "");
  const [amount, setAmount] = useState<number>(10);
  const [donorName, setDonorName] = useState("");
  const [phone, setPhone] = useState("");

  const currency =
    campaigns.find((c) => c.id === campaignId)?.currency ?? "EGP";

  const canCreate = useMemo(() => {
    if (state.kind === "saving") return false;
    return Boolean(campaignId) && Number.isFinite(amount) && amount > 0;
  }, [campaignId, amount, state.kind]);

  async function create() {
    setState({ kind: "saving" });
    const res = await fetch("/api/admin/donations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        amount,
        currency,
        donor_name: donorName.trim() ? donorName.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
      }),
    });

    const data = (await res.json().catch(() => null)) as unknown;
    if (!res.ok) {
      setState({ kind: "error", message: "تعذر إنشاء التبرع." });
      return;
    }

    const id =
      data && typeof data === "object" && "id" in data
        ? String((data as { id?: unknown }).id ?? "")
        : "";
    if (id) {
      router.push(`/admin/donations/${id}`);
      router.refresh();
      setState({ kind: "idle" });
      return;
    }

    router.refresh();
    setState({ kind: "idle" });
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">إضافة تبرع يدوي</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">الحملة</label>
          <Select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.slug})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">القيمة ({currency})</label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الاسم</label>
          <Input
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="اختياري"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">الهاتف</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="اختياري"
            inputMode="tel"
          />
        </div>
        <div className="flex items-end sm:col-span-2">
          <Button type="button" onClick={create} disabled={!canCreate} className="w-full">
            {state.kind === "saving" ? "جارٍ الإضافة..." : "إضافة"}
          </Button>
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}
    </div>
  );
}

