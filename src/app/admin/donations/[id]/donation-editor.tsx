"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DonationRow = {
  id: string;
  amount: number;
  currency: string;
  donor_name: string | null;
  phone: string | null;
  campaign_id: string;
  created_at: string;
};

type CampaignRow = { id: string; title: string; slug: string };

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

export function DonationEditor({
  donation,
  campaigns,
}: {
  donation: DonationRow;
  campaigns: CampaignRow[];
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number>(donation.amount);
  const [donorName, setDonorName] = useState(donation.donor_name ?? "");
  const [phone, setPhone] = useState(donation.phone ?? "");
  const [campaignId, setCampaignId] = useState(donation.campaign_id);
  const [state, setState] = useState<State>({ kind: "idle" });

  const changed = useMemo(() => {
    return (
      amount !== donation.amount ||
      donorName !== (donation.donor_name ?? "") ||
      phone !== (donation.phone ?? "") ||
      campaignId !== donation.campaign_id
    );
  }, [amount, donorName, phone, campaignId, donation]);

  async function save() {
    setState({ kind: "saving" });
    try {
      const res = await fetch(`/api/admin/donations/${donation.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount,
          donor_name: donorName.trim() ? donorName.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          campaign_id: campaignId,
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

  async function removeDonation() {
    const ok = window.confirm("هل تريد حذف هذا التبرع نهائياً؟");
    if (!ok) return;
    setState({ kind: "saving" });
    const res = await fetch(`/api/admin/donations/${donation.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setState({ kind: "error", message: "تعذر الحذف." });
      return;
    }
    window.location.href = "/admin/donations";
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold">تعديل التبرع</div>
        <button
          type="button"
          onClick={removeDonation}
          className="text-sm font-semibold text-pal-red hover:underline"
        >
          حذف التبرع
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">القيمة</label>
          <Input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
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
          <label className="text-sm font-semibold">اسم المتبرع</label>
          <Input
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="اختياري"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الهاتف</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="اختياري"
            inputMode="tel"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">ملاحظات (اختياري)</label>
        <Textarea placeholder="يمكن إضافة ملاحظات داخلية في المرحلة القادمة." disabled />
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

