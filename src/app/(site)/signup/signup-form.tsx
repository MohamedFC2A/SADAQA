"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signupAction } from "@/app/(site)/signup/actions";

export function SignupForm({ nextPath }: { nextPath?: string }) {
  const [name, setName] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [serverState, formAction, pending] = useActionState(signupAction, {
    kind: "idle" as const,
  });

  const nameTrimmed = name.trim();
  const confirmTrimmed = confirmName.trim();
  const phoneTrimmed = phone.trim();
  const emailTrimmed = email.trim();

  const nameOk = nameTrimmed.length >= 2;
  const confirmOk = confirmTrimmed === nameTrimmed && nameOk;
  const phoneOk = phoneTrimmed.length >= 8 && phoneTrimmed.length <= 20;
  const passwordOk = password.length >= 6;

  const canSubmit = useMemo(() => {
    if (pending) return false;
    return nameOk && confirmOk && phoneOk && emailTrimmed.length > 3 && passwordOk;
  }, [pending, nameOk, confirmOk, phoneOk, emailTrimmed.length, passwordOk]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <div className="space-y-2">
        <label className="text-sm font-semibold">الاسم</label>
        <Input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك الحقيقي"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">تأكيد الاسم</label>
        <Input
          name="confirmName"
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
          name="phone"
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
          name="email"
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
          name="password"
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

      {serverState.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {serverState.message}
        </div>
      ) : serverState.kind === "success" ? (
        <div className="rounded-xl border border-pal-green/30 bg-pal-green/10 p-3 text-sm text-pal-green">
          {serverState.needsEmailConfirmation
            ? "تم إنشاء حسابك. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول."
            : "تم إنشاء الحساب بنجاح. جارٍ تجهيز حسابك..."}
        </div>
      ) : null}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {pending ? "جارٍ الإنشاء..." : "إنشاء حساب"}
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
