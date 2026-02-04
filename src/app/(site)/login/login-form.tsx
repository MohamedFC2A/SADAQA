"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [state, setState] = useState<FormState>({ kind: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => {
    if (state.kind === "submitting") return false;
    return email.trim().length > 3 && password.length >= 6;
  }, [state.kind, email, password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });

    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        setState({
          kind: "error",
          message:
            "Supabase غير مُعدّ على Vercel بعد. أضف متغيرات البيئة ثم أعد النشر.",
        });
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setState({
          kind: "error",
          message: "بيانات الدخول غير صحيحة أو غير مسموحة.",
        });
        return;
      }

      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/admin/requests");
      router.refresh();
    } catch {
      setState({
        kind: "error",
        message:
          "تعذر تسجيل الدخول حالياً. تأكد من إعداد Supabase ومتغيرات البيئة.",
      });
    }
  }

  async function loginWithGoogle() {
    setState({ kind: "submitting" });
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setState({
        kind: "error",
        message:
          "Supabase غير مُعدّ على Vercel بعد. أضف متغيرات البيئة ثم أعد النشر.",
      });
      return;
    }

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
      nextPath && nextPath.startsWith("/") ? nextPath : "/admin/requests",
    )}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) {
      setState({
        kind: "error",
        message: "تعذر تسجيل الدخول بجوجل. تأكد من إعداد Supabase OAuth.",
      });
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-3">
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={loginWithGoogle}
        >
          المتابعة باستخدام Google
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
          <div className="text-xs text-black/50 dark:text-white/50">أو</div>
          <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">البريد الإلكتروني</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="admin@example.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">كلمة المرور</label>
        <Input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {state.kind === "submitting" ? "جارٍ الدخول..." : "دخول"}
      </Button>

      <div className="text-xs text-black/60 dark:text-white/60">
        ملاحظة: لتفعيل Google Login أضف Redirect URL داخل Supabase Auth إلى:
        <div className="mt-1 font-mono">/auth/callback</div>
      </div>
    </form>
  );
}
