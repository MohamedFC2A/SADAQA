"use client";

import { useActionState, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction } from "@/app/(site)/login/actions";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [serverState, formAction, pending] = useActionState(loginAction, {
    kind: "idle" as const,
  });

  const canSubmit = useMemo(() => {
    if (pending) return false;
    return email.trim().length > 3 && password.length >= 6;
  }, [pending, email, password]);

  async function loginWithGoogle() {
    // Keep OAuth initiation in the browser. The /auth/callback route exchanges the code
    // and sets the server cookies.
    const supabase = await getSupabaseBrowserClient();
    if (!supabase) {
      // Server action will handle email/password, but OAuth needs client env.
      return;
    }

    const origin = window.location.origin;
    const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(
      nextPath && nextPath.startsWith("/") ? nextPath : "/profile",
    )}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });

    if (error) return;
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
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
          <div className="h-px flex-1 bg-border" />
          <div className="text-xs text-muted-foreground/70">أو</div>
          <div className="h-px flex-1 bg-border" />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold">البريد الإلكتروني</label>
        <Input
          name="email"
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
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </div>

      {serverState.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {serverState.message}
        </div>
      ) : null}

      <Button type="submit" disabled={!canSubmit} className="w-full">
        {pending ? "جارٍ الدخول..." : "دخول"}
      </Button>

      <div className="text-xs text-muted-foreground">
        ملاحظة: لتفعيل Google Login أضف Redirect URL داخل Supabase Auth إلى:
        <div className="mt-1 font-mono">/auth/callback</div>
      </div>
    </form>
  );
}
