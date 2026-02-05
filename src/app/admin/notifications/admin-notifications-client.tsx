"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type UserOption = { id: string; name: string; phone: string | null };

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

export function AdminNotificationsClient({ users }: { users: UserOption[] }) {
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [scope, setScope] = useState<"global" | "user">("global");
  const [targetUserId, setTargetUserId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    if (title.trim().length < 2) return false;
    if (body.trim().length < 5) return false;
    if (scope === "user" && targetUserId.trim().length < 10) return false;
    return true;
  }, [state.kind, title, body, scope, targetUserId]);

  async function submit() {
    if (!canSubmit) return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scope,
          targetUserId: scope === "user" ? targetUserId : undefined,
          title: title.trim(),
          body: body.trim(),
          linkUrl: linkUrl.trim() ? linkUrl.trim() : undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setState({
          kind: "error",
          message:
            typeof data?.message === "string"
              ? data.message
              : "تعذر إرسال الإشعار.",
        });
        return;
      }
      setState({ kind: "success" });
      setTitle("");
      setBody("");
      setLinkUrl("");
      if (scope === "user") setTargetUserId("");
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold">النوع</label>
          <Select value={scope} onChange={(e) => setScope(e.target.value as any)}>
            <option value="global">إشعار عام</option>
            <option value="user">لمستخدم محدد</option>
          </Select>
        </div>

        {scope === "user" ? (
          <div className="space-y-2">
            <label className="text-sm font-semibold">المستخدم</label>
            <Select value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              <option value="">اختر مستخدم</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.phone ? `— ${u.phone}` : ""} ({u.id.slice(0, 8)}…)
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">العنوان</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">المحتوى</label>
        <Input value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="text-xs text-muted-foreground">
          نص قصير وواضح. يمكنك إضافة تفاصيل أكثر لاحقاً.
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">(اختياري) رابط</label>
        <Input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="/profile أو /notifications"
        />
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : state.kind === "success" ? (
        <div className="rounded-xl border border-pal-green/30 bg-pal-green/10 p-3 text-sm text-pal-green">
          تم إرسال الإشعار.
        </div>
      ) : null}

      <Button onClick={submit} disabled={!canSubmit} className="w-full">
        {state.kind === "submitting" ? "جارٍ الإرسال..." : "إرسال إشعار"}
      </Button>
    </div>
  );
}

