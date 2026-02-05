"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestStatuses,
  requestTypes,
  statusLabelAr,
  requestTypeLabelAr,
  type RequestStatus,
  type RequestType,
} from "@/lib/requests/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type State =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "saved" };

export function RequestEditor(props: {
  id: string;
  status: RequestStatus;
  admin_notes: string;
  requester_name?: string;
  phone?: string;
  location?: string;
  request_type?: RequestType;
  description?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RequestStatus>(props.status);
  const [notes, setNotes] = useState(props.admin_notes);
  const [requesterName, setRequesterName] = useState(props.requester_name ?? "");
  const [phone, setPhone] = useState(props.phone ?? "");
  const [location, setLocation] = useState(props.location ?? "");
  const [type, setType] = useState<RequestType>(props.request_type ?? "food");
  const [description, setDescription] = useState(props.description ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });

  const changed = useMemo(() => {
    return (
      status !== props.status ||
      notes !== props.admin_notes ||
      requesterName !== (props.requester_name ?? "") ||
      phone !== (props.phone ?? "") ||
      location !== (props.location ?? "") ||
      type !== (props.request_type ?? "food") ||
      description !== (props.description ?? "")
    );
  }, [
    status,
    notes,
    requesterName,
    phone,
    location,
    type,
    description,
    props.status,
    props.admin_notes,
    props.requester_name,
    props.phone,
    props.location,
    props.request_type,
    props.description,
  ]);

  async function save() {
    setState({ kind: "saving" });
    try {
      const res = await fetch(`/api/admin/requests/${props.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          admin_notes: notes,
          requester_name: requesterName,
          phone,
          location,
          request_type: type,
          description,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">إدارة الطلب</div>
        <button
          type="button"
          onClick={async () => {
            const ok = window.confirm("هل تريد حذف الطلب نهائياً؟");
            if (!ok) return;
            setState({ kind: "saving" });
            const res = await fetch(`/api/admin/requests/${props.id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              setState({ kind: "error", message: "تعذر حذف الطلب." });
              return;
            }
            window.location.href = "/admin/requests";
          }}
          className="text-sm font-semibold text-pal-red hover:underline"
        >
          حذف الطلب
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">الاسم</label>
          <Input
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">الهاتف</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">الموقع</label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">نوع الاحتياج</label>
          <Select
            value={type}
            onChange={(e) =>
              setType(e.target.value as (typeof requestTypes)[number])
            }
          >
            {requestTypes.map((t) => (
              <option key={t} value={t}>
                {requestTypeLabelAr[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">الحالة</label>
        <Select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as (typeof requestStatuses)[number])
          }
        >
          {requestStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabelAr[s]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">ملاحظات الأدمن</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات داخلية..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">وصف الحالة</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="تفاصيل الحالة..."
        />
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
        variant="primary"
        onClick={save}
        disabled={!changed || state.kind === "saving"}
        className="w-full"
      >
        {state.kind === "saving" ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </Button>
    </div>
  );
}
