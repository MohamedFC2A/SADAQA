"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { requestNeedDetails, requestTypeLabelAr, requestTypes } from "@/lib/requests/constants";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "success"; id: string };

type Profile = { name: string; phone: string; isAnonymous: boolean };

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

type GpsState =
  | { kind: "idle" }
  | { kind: "locating" }
  | { kind: "error"; message: string }
  | {
      kind: "gps";
      lat: number;
      lng: number;
      accuracyM: number | null;
      displayName: string | null;
    };

export function RequestHelpForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const [governorate, setGovernorate] = useState("القاهرة");
  const [addressDetail, setAddressDetail] = useState("");
  const [requestDetail, setRequestDetail] = useState<string>("");
  const [requestType, setRequestType] = useState<(typeof requestTypes)[number]>(
    "food",
  );
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [gps, setGps] = useState<GpsState>({ kind: "idle" });

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    if (requestType === "medical" && files.length === 0) return false;
    if (profile.name.trim().length < 2) return false;
    if (profile.phone.trim().length < 8) return false;
    return (
      requestDetail.trim().length > 0 &&
      addressDetail.trim().length >= 8 &&
      description.trim().length >= 30
    );
  }, [
    state.kind,
    requestDetail,
    addressDetail,
    description,
    requestType,
    files.length,
    profile.name,
    profile.phone,
  ]);

  const locationString = `${governorate} — ${addressDetail.trim()}`;

  async function detectLocation() {
    if (gps.kind === "locating") return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGps({ kind: "error", message: "ميزة تحديد الموقع غير متاحة على هذا الجهاز." });
      return;
    }

    setGps({ kind: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyM = Number.isFinite(pos.coords.accuracy)
          ? Math.round(pos.coords.accuracy)
          : null;

        let displayName: string | null = null;
        try {
          const url = new URL("/api/geocode/reverse", window.location.origin);
          url.searchParams.set("lat", String(lat));
          url.searchParams.set("lng", String(lng));
          const res = await fetch(url.toString(), { cache: "no-store" });
          const data = (await res.json().catch(() => null)) as unknown;
          if (res.ok && data && typeof data === "object") {
            const obj = data as Record<string, unknown>;
            const dn = typeof obj["displayName"] === "string" ? obj["displayName"] : null;
            displayName = dn;
            const gov = typeof obj["governorate"] === "string" ? obj["governorate"] : null;
            const detail =
              typeof obj["addressDetail"] === "string" ? obj["addressDetail"] : null;
            if (gov && governorates.includes(gov)) setGovernorate(gov);
            if (detail && detail.trim().length >= 8) setAddressDetail(detail);
          }
        } catch {
          // ignore reverse geocode errors; user can type address manually.
        }

        setGps({ kind: "gps", lat, lng, accuracyM, displayName });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "تم رفض إذن الموقع. يمكنك إدخال العنوان يدوياً."
            : "تعذر تحديد موقعك الآن. جرّب مرة أخرى أو اكتب العنوان يدوياً.";
        setGps({ kind: "error", message: msg });
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    try {
      const detailLabel =
        requestNeedDetails[requestType].find((opt) => opt.value === requestDetail)
          ?.label ?? "";

      const form = new FormData();
      form.set("request_type", requestType);
      form.set("request_detail", requestDetail);
      if (detailLabel) form.set("request_detail_label", detailLabel);
      form.set("governorate", governorate);
      form.set("address_detail", addressDetail);
      form.set("location", locationString);

      if (gps.kind === "gps") {
        form.set("location_source", "gps");
        form.set("location_lat", String(gps.lat));
        form.set("location_lng", String(gps.lng));
        if (gps.accuracyM !== null) {
          form.set("location_accuracy_m", String(gps.accuracyM));
        }
        if (gps.displayName) {
          form.set("location_display_name", gps.displayName);
        }
      } else {
        form.set("location_source", "manual");
      }

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

  const detailOptions = requestNeedDetails[requestType];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-border bg-surface-2 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="text-sm font-semibold">بيانات الحساب (لا يمكن تعديلها هنا)</div>
            <div className="text-xs text-muted-foreground">
              الاسم ورقم الهاتف يُؤخذان من حسابك لضمان صحة التواصل.
            </div>
          </div>
          <Link
            href="/profile"
            className="text-sm font-semibold text-pal-green hover:underline"
          >
            تعديل بيانات الحساب
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1 rounded-2xl border border-border bg-surface p-3 text-sm">
            <div className="text-xs text-muted-foreground">الاسم</div>
            <div className="font-semibold">
              {profile.isAnonymous ? "مجهول" : profile.name || "—"}
            </div>
            {profile.isAnonymous ? (
              <div className="text-xs text-muted-foreground">
                الوضع المجهول مفعل من صفحة الحساب.
              </div>
            ) : null}
          </div>
          <div className="space-y-1 rounded-2xl border border-border bg-surface p-3 text-sm">
            <div className="text-xs text-muted-foreground">رقم التواصل</div>
            <div className="font-semibold">{profile.phone || "—"}</div>
            {profile.phone.trim().length < 8 ? (
              <div className="text-xs text-pal-red">
                أضف رقم هاتف صحيح في صفحة الحساب قبل إرسال الطلب.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-border bg-surface-2 p-4 shadow-sm sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">الموقع</label>
          <Button
            type="button"
            variant="secondary"
            onClick={detectLocation}
            disabled={gps.kind === "locating"}
            className="w-full"
          >
            {gps.kind === "locating" ? "جارٍ تحديد الموقع..." : "تحديد موقعي الآن"}
          </Button>
          {gps.kind === "gps" ? (
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>
                تم الالتقاط:{" "}
                <span className="font-semibold">
                  {gps.displayName ?? "تم تحديد الموقع عبر GPS"}
                </span>
              </div>
              <a
                className="font-semibold text-pal-green hover:underline"
                href={`https://www.google.com/maps?q=${encodeURIComponent(`${gps.lat},${gps.lng}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                فتح على الخريطة
              </a>
              {gps.accuracyM !== null ? <div>الدقة: {gps.accuracyM}m</div> : null}
            </div>
          ) : gps.kind === "error" ? (
            <div className="text-xs text-pal-red">{gps.message}</div>
          ) : (
            <div className="text-xs text-muted-foreground">
              إن لم تعمل الميزة، يمكنك إدخال العنوان يدوياً بالأسفل.
            </div>
          )}
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
          <p className="text-xs text-muted-foreground">
            نستخدمه للتوصيل السريع أو الزيارة الميدانية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-3xl border border-border bg-surface-2 p-4 shadow-sm sm:grid-cols-2">
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
          <label className="text-sm font-semibold">التفصيل (إجباري)</label>
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
          <p className="text-xs text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">
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
          <p className="text-xs text-muted-foreground">
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
        <div className="text-xs text-muted-foreground">
          بإرسال الطلب أنت توافق على استخدام بياناتك للتواصل السريع وتأكيد الاستحقاق.
        </div>
      </div>
    </form>
  );
}
