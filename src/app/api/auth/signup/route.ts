import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().min(3).max(255).email(),
  password: z.string().min(6).max(200),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const json = (await request.json().catch(() => null)) as unknown;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const origin = request.headers.get("origin") ?? undefined;
    const next = parsed.data.next && parsed.data.next.startsWith("/")
      ? parsed.data.next
      : "/onboarding";
    const emailRedirectTo = origin
      ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      : undefined;

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: parsed.data.name,
          phone: parsed.data.phone,
        },
      },
    });

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      const already =
        msg.includes("already") ||
        msg.includes("registered") ||
        msg.includes("exists");
      return NextResponse.json(
        { error: already ? "EMAIL_ALREADY_REGISTERED" : "SIGNUP_FAILED", message: error.message },
        { status: already ? 409 : 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      needsEmailConfirmation: !data.session,
    });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/auth/signup]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

