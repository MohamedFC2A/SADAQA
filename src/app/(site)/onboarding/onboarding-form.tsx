"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string };

export function OnboardingForm({
  profile,
  nextPath,
}: {
  profile: { name: string; phone: string | null };
  nextPath?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const [name, setName] = useState(profile.name ?? "");
  const [confirmName, setConfirmName] = useState("");
  const [phone, setPhone] = useState(profile.phone ?? "");

  const nameTrimmed = name.trim();
  const confirmTrimmed = confirmName.trim();
  const phoneTrimmed = phone.trim();

  const nameOk = nameTrimmed.length >= 2;
  const confirmOk = confirmTrimmed === nameTrimmed && nameOk;
  const phoneOk = phoneTrimmed.length >= 8 && phoneTrimmed.length <= 20;

  const canSubmit = useMemo(() => {
    if (state.kind === "saving") return false;
    return nameOk && confirmOk && phoneOk;
  }, [state.kind, nameOk, confirmOk, phoneOk]);

  async function save() {
    if (!canSubmit) return;
    setState({ kind: "saving" });
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: nameTrimmed,
          phone: phoneTrimmed,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as unknown;
        const message =
          data && typeof data === "object" && typeof (data as any).message === "string"
            ? String((data as any).message)
            : "تعذر حفظ البيانات حالياً.";
        setState({ kind: "error", message });
        return;
      }

      const next =
        nextPath && nextPath.startsWith("/") ? nextPath : "/profile";
      router.push(next);
      router.refresh();
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">الاسم</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">تأكيد الاسم</label>
        <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
        {!confirmOk && confirmTrimmed.length > 0 ? (
          <div className="text-xs text-pal-red">تأكيد الاسم غير مطابق.</div>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">رقم الهاتف (إجباري)</label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
        {!phoneOk && phoneTrimmed.length > 0 ? (
          <div className="text-xs text-pal-red">أدخل رقم هاتف صحيح (8–20 رقم).</div>
        ) : null}
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}

      <Button onClick={save} disabled={!canSubmit} className="w-full">
        {state.kind === "saving" ? "جارٍ الحفظ..." : "حفظ والمتابعة"}
      </Button>
    </div>
  );
}

