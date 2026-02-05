"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  statusLabelAr,
  type RequestStatus,
} from "@/lib/requests/constants";

type ApiOk = {
  id: string;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ok"; data: ApiOk };

export function RequestStatusChecker({ initialId }: { initialId: string }) {
  const [id, setId] = useState(initialId);
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const canCheck = useMemo(() => {
    if (state.kind === "loading") return false;
    return id.trim().length > 10 && phone.trim().length >= 8;
  }, [id, phone, state.kind]);

  async function check() {
    setState({ kind: "loading" });
    try {
      const url = new URL("/api/requests/status", window.location.origin);
      url.searchParams.set("id", id.trim());
      url.searchParams.set("phone", phone.trim());
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) {
        setState({
          kind: "error",
          message:
            res.status === 404
              ? "لم يتم العثور على طلب بهذه البيانات."
              : "تعذر جلب الحالة حالياً.",
        });
        return;
      }
      const data = (await res.json()) as ApiOk;
      setState({ kind: "ok", data });
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">رقم الطلب</label>
          <Input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="UUID"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold">رقم الهاتف</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="نفس الرقم المستخدم في الطلب"
            inputMode="tel"
          />
        </div>
      </div>

      <Button type="button" onClick={check} disabled={!canCheck}>
        {state.kind === "loading" ? "جارٍ التحقق..." : "عرض الحالة"}
      </Button>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}

      {state.kind === "ok" ? (
        <Card className="p-5 space-y-2">
          <div className="text-sm font-semibold">النتيجة</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            <div>
              الحالة:{" "}
              <span className="font-semibold">
                {statusLabelAr[state.data.status]}
              </span>
            </div>
            <div className="mt-2 text-xs text-black/60 dark:text-white/60">
              آخر تحديث: {new Date(state.data.updated_at).toLocaleString("ar")}
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
