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
  payment_code?: string | null;
  payment_method?: string | null;
  status?: string | null;
  created_at: string;
};

type CampaignRow = { id: string; title: string; slug: string };

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved" }
  | { kind: "error"; message: string };

const paymentMethods = [
  "vodafone_cash",
  "bank_transfer",
  "whatsapp",
  "fawry",
  "instapay",
  "other",
] as const;

const statuses = ["pending", "verified", "canceled", "proof_sent"] as const;

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
  const [paymentMethod, setPaymentMethod] = useState(
    donation.payment_method ?? "",
  );
  const [status, setStatus] = useState(donation.status ?? "pending");
  const [state, setState] = useState<State>({ kind: "idle" });

  const changed = useMemo(() => {
    return (
      amount !== donation.amount ||
      donorName !== (donation.donor_name ?? "") ||
      phone !== (donation.phone ?? "") ||
      campaignId !== donation.campaign_id ||
      paymentMethod !== (donation.payment_method ?? "") ||
      status !== (donation.status ?? "pending")
    );
  }, [amount, donorName, phone, campaignId, paymentMethod, status, donation]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

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
          payment_method: paymentMethod.trim() ? paymentMethod.trim() : null,
          status,
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

      {donation.payment_code ? (
        <div className="rounded-2xl border border-black/10 bg-black/5 p-4 dark:border-white/10 dark:bg-white/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-black/60 dark:text-white/60">
                كود الدفع
              </div>
              <div className="mt-1 font-mono text-lg font-bold">
                {donation.payment_code}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => copy(donation.payment_code ?? "")}
            >
              نسخ الكود
            </Button>
          </div>
        </div>
      ) : null}

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

        <div className="space-y-2">
          <label className="text-sm font-semibold">طريقة الدفع</label>
          <Select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">—</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الحالة</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
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
