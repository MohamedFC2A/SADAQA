"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { requestTypeLabelAr, requestTypes } from "@/lib/requests/constants";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; id: string };

type ProfileResponse =
  | { profile: { name: string; phone: string | null } }
  | { error: string };

const governorates = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الشرقية",
  "الدقهلية",
  "الغربية",
  "المنوفية",
  "كفر الشيخ",
  "البحيرة",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
];

const needOptions: Record<(typeof requestTypes)[number], { value: string; label: string }[]> =
  {
    food: [
      { value: "grocery_basic", label: "مواد غذائية (أرز/سكر/زيت)" },
      { value: "food_box", label: "سلة غذائية كاملة" },
      { value: "ready_meals", label: "وجبات جاهزة / مطبوخة" },
    ],
    housing: [
      { value: "blankets", label: "بطاطين / تدفئة" },
      { value: "rent", label: "مساعدة إيجار عاجلة" },
      { value: "repair", label: "ترميم بسيط / صيانة منزلية" },
      { value: "furniture", label: "أثاث أساسي (سرير/مرتبة)" },
    ],
    medical: [
      { value: "consult", label: "كشف / استشارة طبية" },
      { value: "medicine", label: "دواء / روشتة" },
      { value: "procedure", label: "عملية / إجراء طبي" },
      { value: "tests", label: "تحاليل / أشعة" },
    ],
  };

export function RequestHelpForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const [requesterName, setRequesterName] = useState("");
  const [phone, setPhone] = useState("");
  const [governorate, setGovernorate] = useState("القاهرة");
  const [addressDetail, setAddressDetail] = useState("");
  const [requestDetail, setRequestDetail] = useState<string>("");
  const [requestType, setRequestType] = useState<(typeof requestTypes)[number]>(
    "food",
  );
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [lockedProfile, setLockedProfile] = useState(false);

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    if (requestType === "medical" && files.length === 0) return false;
    return (
      requesterName.trim().length >= 2 &&
      phone.trim().length >= 8 &&
      addressDetail.trim().length >= 8 &&
      description.trim().length >= 30
    );
  }, [state.kind, requesterName, phone, addressDetail, description, requestType, files.length]);

  useEffect(() => {
    let ignore = false;
    fetch("/api/profile", { cache: "no-store" })
      .then((res) => res.json() as Promise<ProfileResponse>)
      .then((data) => {
        if (ignore) return;
        if ("profile" in data && data.profile) {
          if (data.profile.name) setRequesterName(data.profile.name);
          if (data.profile.phone) setPhone(data.profile.phone);
          setLockedProfile(Boolean(data.profile.name || data.profile.phone));
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const locationString = `${governorate} — ${addressDetail.trim()}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    try {
      const detailLabel =
        needOptions[requestType].find((opt) => opt.value === requestDetail)?.label ??
        "";

      const form = new FormData();
      form.set("requester_name", requesterName);
      form.set("phone", phone);
      form.set("location", locationString);
      form.set("request_type", requestType);
      const composedDescription =
        detailLabel && !description.includes(detailLabel)
          ? `${description}\n\nالتفصيل المختار: ${detailLabel}`
          : description;
      form.set("description", composedDescription);
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

  const detailOptions = needOptions[requestType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-black/40 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">اسم صاحب الطلب</label>
          <Input
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="مثال: أحمد محمد"
            autoComplete="name"
            readOnly={lockedProfile}
          />
          {lockedProfile ? (
            <p className="text-xs text-pal-green">مأخوذ من حسابك — لا يمكن تعديله هنا.</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">رقم التواصل</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثال: 01xxxxxxxxx"
            inputMode="tel"
            autoComplete="tel"
            readOnly={lockedProfile}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">المحافظة</label>
          <Select value={governorate} onChange={(e) => setGovernorate(e.target.value)}>
            {governorates.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">العنوان التفصيلي</label>
          <Input
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="مثال: شارع النصر، بجوار مسجد ..., الدور الثاني"
          />
          <p className="text-xs text-black/50 dark:text-white/60">
            نستخدمه للتوصيل السريع أو الزيارة الميدانية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-black/10 bg-white/70 p-4 shadow-sm dark:border-white/10 dark:bg-black/40 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">نوع الاحتياج (النقدي متوقف مؤقتاً)</label>
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
        <div className="space-y-2">
          <label className="text-sm font-semibold">التفصيل</label>
          <Select
            value={requestDetail}
            onChange={(e) => setRequestDetail(e.target.value)}
          >
            <option value="">اختر التفصيل</option>
            {detailOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="text-xs text-black/50 dark:text-white/60">
            يساعدنا على تجهيز الدعم المناسب بشكل أسرع.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">وصف تفصيلي للحالة</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اذكر الوضع الحالي، عدد الأفراد، وأي معلومات طبية أو سكنية أو غذائية مهمة."
          />
          <p className="text-xs text-black/60 dark:text-white/60">
            لا تُشارك كلمات مرور أو معلومات مالية حساسة. الطلبات تعتبر عاجلة افتراضياً.
          </p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">
            {requestType === "medical" ? "رفع مرفق طبي (إجباري)" : "رفع صور داعمة (اختياري)"}
          </label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => onFilesChange(e.target.files)}
          />
          <p className="text-xs text-black/60 dark:text-white/60">
            حد أقصى 5 صور (2MB لكل صورة). للطلبات العلاجية أرفق روشتة/تقرير/استشارة.
          </p>
          {requestType === "medical" && files.length === 0 ? (
            <div className="text-xs text-pal-red">مطلوب مرفق طبي واحد على الأقل.</div>
          ) : null}
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" disabled={!canSubmit}>
          {state.kind === "submitting" ? "جارٍ الإرسال..." : "إرسال الطلب العاجل"}
        </Button>
        <div className="text-xs text-black/60 dark:text-white/60">
          بإرسال الطلب أنت توافق على استخدام بياناتك للتواصل السريع وتأكيد الاستحقاق.
        </div>
      </div>
    </form>
  );
}
