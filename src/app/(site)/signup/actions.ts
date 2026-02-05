"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

type State =
  | { kind: "idle" }
  | { kind: "success"; needsEmailConfirmation: boolean }
  | { kind: "error"; message: string };

function safeNext(nextRaw: unknown) {
  const next = typeof nextRaw === "string" ? nextRaw : "";
  return next.startsWith("/") ? next : "/onboarding";
}

export async function signupAction(_prev: State, formData: FormData): Promise<State> {
  const name = String(formData.get("name") ?? "").trim();
  const confirmName = String(formData.get("confirmName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (name.length < 2) return { kind: "error", message: "أدخل اسم صحيح." };
  if (confirmName !== name) return { kind: "error", message: "تأكيد الاسم غير مطابق." };
  if (phone.length < 8 || phone.length > 20) {
    return { kind: "error", message: "أدخل رقم هاتف صحيح (8–20 رقم)." };
  }
  if (email.length < 3 || !email.includes("@")) {
    return { kind: "error", message: "أدخل بريد إلكتروني صحيح." };
  }
  if (password.length < 6) {
    return { kind: "error", message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." };
  }

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get("origin");
  const emailRedirectTo = origin
    ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
    : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
      data: { full_name: name, phone },
    },
  });

  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    const already =
      msg.includes("already") || msg.includes("registered") || msg.includes("exists");
    return {
      kind: "error",
      message: already ? "هذا البريد مسجل بالفعل. سجّل دخولك بدلاً من ذلك." : error.message,
    };
  }

  const needsEmailConfirmation = !data.session;
  if (!needsEmailConfirmation) {
    redirect(`/onboarding?next=${encodeURIComponent(next)}`);
  }

  return { kind: "success", needsEmailConfirmation: true };
}
