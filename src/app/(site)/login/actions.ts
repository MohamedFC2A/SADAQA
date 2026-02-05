"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type State =
  | { kind: "idle" }
  | { kind: "error"; message: string };

function safeNext(nextRaw: unknown) {
  const next = typeof nextRaw === "string" ? nextRaw : "";
  return next.startsWith("/") ? next : "/profile";
}

export async function loginAction(_prev: State, formData: FormData): Promise<State> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (email.length < 3 || password.length < 6) {
    return { kind: "error", message: "تأكد من البريد الإلكتروني وكلمة المرور." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.message?.toLowerCase() ?? "";
    const notConfirmed =
      msg.includes("email") && (msg.includes("confirm") || msg.includes("verified"));
    return {
      kind: "error",
      message: notConfirmed
        ? "الحساب غير مؤكد. راجع بريدك الإلكتروني ثم حاول مرة أخرى."
        : "بيانات الدخول غير صحيحة أو غير مسموحة.",
    };
  }

  redirect(next);
}

