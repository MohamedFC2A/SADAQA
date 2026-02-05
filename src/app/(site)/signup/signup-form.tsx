"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; needsEmailConfirmation: boolean }
  | { kind: "error"; message: string };

export function SignupForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ kind: "idle" });

  const [name, setName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nameTrimmed = name.trim();
  const confirmTrimmed = confirmName.trim();
  const phoneTrimmed = phone.trim();
  const emailTrimmed = email.trim();

  const nameOk = nameTrimmed.length >= 2;
  const confirmOk = confirmTrimmed === nameTrimmed && nameOk;
  const phoneOk = phoneTrimmed.length >= 8 && phoneTrimmed.length <= 20;
  const passwordOk = password.length >= 6;

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    return nameOk && confirmOk && phoneOk && emailTrimmed.length > 3 && passwordOk;
  }, [state.kind, nameOk, confirmOk, phoneOk, emailTrimmed.length, passwordOk]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState({ kind: "submitting" });

    try {
      const next = nextPath && nextPath.startsWith("/") ? nextPath : "/onboarding";
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: nameTrimmed,
          phone: phoneTrimmed,
          email: emailTrimmed,
          password,
          next,
        }),
      });

      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setState({
          kind: "error",
          message:
            String(data?.error ?? "")
              .toLowerCase()
              .includes("email_already")
              ? "هذا البريد مسجل بالفعل. سجّل دخولك بدلاً من ذلك."
              : "تعذر إنشاء الحساب حالياً. تحقق من البيانات أو جرّب مرة أخرى.",
        });
        return;
      }

      const needsEmailConfirmation = data?.needsEmailConfirmation === true;
      setState({ kind: "success", needsEmailConfirmation });

      if (!needsEmailConfirmation) {
        router.push(`/onboarding?next=${encodeURIComponent(next)}`);
        router.refresh();
      }
    } catch {
      setState({
        kind: "error",
        message: "حدث خطأ غير متوقع أثناء إنشاء الحساب.",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">الاسم</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الحقيقي" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">تأكيد الاسم</label>
        <Input
          value={confirmName}
          onChange={(e) => setConfirmName(e.target.value)}
          placeholder="اكتب الاسم مرة ثانية"
        />
        {!confirmOk && confirmTrimmed.length > 0 ? (
          <div className="text-xs text-pal-red">تأكيد الاسم غير مطابق.</div>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">رقم الهاتف (إجباري)</label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
          placeholder="مثال: 01012345678"
        />
        {!phoneOk && phoneTrimmed.length > 0 ? (
          <div className="text-xs text-pal-red">أدخل رقم هاتف صحيح (8–20 رقم).</div>
        ) : null}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">البريد الإلكتروني</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">كلمة المرور</label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
        />
        {!passwordOk && password.length > 0 ? (
          <div className="text-xs text-pal-red">كلمة المرور يجب أن تكون 6 أحرف على الأقل.</div>
        ) : null}
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : state.kind === "success" ? (
        <div className="rounded-xl border border-pal-green/30 bg-pal-green/10 p-3 text-sm text-pal-green">
          {state.needsEmailConfirmation
            ? "تم إنشاء حسابك. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول."
            : "تم إنشاء الحساب بنجاح. جارٍ تجهيز حسابك..."}
        </div>
      ) : null}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {state.kind === "submitting" ? "جارٍ الإنشاء..." : "إنشاء حساب"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        لديك حساب بالفعل؟{" "}
        <Link
          href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="font-semibold text-pal-green hover:underline"
        >
          تسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
