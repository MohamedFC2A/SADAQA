"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  requestStatuses,
  urgencyLevels,
  statusLabelAr,
  urgencyLabelAr,
  type RequestStatus,
  type UrgencyLevel,
} from "@/lib/requests/constants";
import { Button } from "@/components/ui/button";
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
  urgency_level: UrgencyLevel;
  admin_notes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<RequestStatus>(props.status);
  const [urgency, setUrgency] = useState<UrgencyLevel>(props.urgency_level);
  const [notes, setNotes] = useState(props.admin_notes);
  const [state, setState] = useState<State>({ kind: "idle" });

  const changed = useMemo(() => {
    return (
      status !== props.status ||
      urgency !== props.urgency_level ||
      notes !== props.admin_notes
    );
  }, [status, urgency, notes, props.status, props.urgency_level, props.admin_notes]);

  async function save() {
    setState({ kind: "saving" });
    try {
      const res = await fetch(`/api/admin/requests/${props.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status,
          urgency_level: urgency,
          admin_notes: notes,
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
      <div className="text-sm font-semibold">إدارة الطلب</div>

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
        <label className="text-sm font-semibold">الأولوية</label>
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

      <div className="space-y-2">
        <label className="text-sm font-semibold">ملاحظات الأدمن</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات داخلية..."
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
