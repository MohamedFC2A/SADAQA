import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import {
  copyResponseCookies,
  createSupabaseRouteHandlerClient,
} from "@/lib/supabase/route-handler";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().min(3).max(255).email(),
  password: z.string().min(6).max(200),
});

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json().catch(() => null)) as unknown;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const base = NextResponse.next();
    const supabase = createSupabaseRouteHandlerClient(request, base);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS" },
        { status: 401 },
      );
    }

    const out = NextResponse.json({ ok: true });
    copyResponseCookies(base, out);
    return out;
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/auth/login]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}
