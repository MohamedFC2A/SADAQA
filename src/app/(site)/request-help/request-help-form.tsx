"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  requestTypeLabelAr,
  requestTypes,
  urgencyLabelAr,
  urgencyLevels,
} from "@/lib/requests/constants";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; id: string };

export function RequestHelpForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const [requesterName, setRequesterName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [requestType, setRequestType] = useState<(typeof requestTypes)[number]>(
    "money",
  );
  const [urgency, setUrgency] = useState<(typeof urgencyLevels)[number]>(
    "medium",
  );
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    return (
      requesterName.trim().length >= 2 &&
      phone.trim().length >= 8 &&
      location.trim().length >= 2 &&
      description.trim().length >= 20
    );
  }, [state.kind, requesterName, phone, location, description]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    try {
      const form = new FormData();
      form.set("requester_name", requesterName);
      form.set("phone", phone);
      form.set("location", location);
      form.set("request_type", requestType);
      form.set("urgency_level", urgency);
      form.set("description", description);
      for (const file of files.slice(0, 5)) {
        form.append("images", file);
      }

      const res = await fetch("/api/requests", { method: "POST", body: form });
      const data = (await res.json()) as unknown;

      if (!res.ok) {
        setState({
          kind: "error",
          message:
            "تعذر إرسال الطلب حالياً. تأكد من البيانات وحاول مرة أخرى.",
        });
        return;
      }

      const id = (() => {
        if (typeof data !== "object" || data === null) return "";
        if (!("id" in data)) return "";
        const maybe = (data as { id?: unknown }).id;
        return typeof maybe === "string" ? maybe : String(maybe ?? "");
      })();

      if (!id) {
        setState({
          kind: "error",
          message: "تم الإرسال لكن لم نستلم رقم الطلب. حاول مرة أخرى.",
        });
        return;
      }

      setState({ kind: "success", id });
      router.push(`/request-help/success?id=${encodeURIComponent(id)}`);
    } catch {
      setState({
        kind: "error",
        message: "حدث خطأ غير متوقع. حاول مرة أخرى.",
      });
    }
  }

  function onFilesChange(list: FileList | null) {
    if (!list) {
      setFiles([]);
      return;
    }
    setFiles(Array.from(list));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">اسم صاحب الطلب</label>
          <Input
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="مثال: أحمد محمد"
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">رقم التواصل</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثال: 05xxxxxxxx"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الموقع/المنطقة</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="مثال: غزة - الشجاعية"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">نوع الاحتياج</label>
          <Select
            value={requestType}
            onChange={(e) =>
              setRequestType(e.target.value as (typeof requestTypes)[number])
            }
          >
            {requestTypes.map((t) => (
              <option key={t} value={t}>
                {requestTypeLabelAr[t]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">درجة الإلحاح</label>
          <Select
            value={urgency}
            onChange={(e) =>
              setUrgency(e.target.value as (typeof urgencyLevels)[number])
            }
          >
            {urgencyLevels.map((u) => (
              <option key={u} value={u}>
                {urgencyLabelAr[u]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">وصف تفصيلي للحالة</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اكتب تفاصيل الحالة وما تحتاجه (مثال: علاج/طعام/بطانية...)."
          />
          <p className="text-xs text-black/60 dark:text-white/60">
            ملاحظة: لا تُشارك كلمات مرور أو معلومات مالية حساسة داخل الوصف.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">(اختياري) رفع صور</label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => onFilesChange(e.target.files)}
          />
          <p className="text-xs text-black/60 dark:text-white/60">
            حد أقصى 5 صور (2MB لكل صورة).
          </p>
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={!canSubmit}>
          {state.kind === "submitting" ? "جارٍ الإرسال..." : "إرسال الطلب"}
        </Button>
        <div className="text-xs text-black/60 dark:text-white/60">
          بإرسال الطلب أنت توافق على استخدام بياناتك للتواصل فقط.
        </div>
      </div>
    </form>
  );
}
