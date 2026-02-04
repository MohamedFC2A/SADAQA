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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
    </form>
  );
}

