import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import {
  copyResponseCookies,
  createSupabaseRouteHandlerClient,
} from "@/lib/supabase/route-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const base = NextResponse.next();
    const supabase = createSupabaseRouteHandlerClient(request, base);
    await supabase.auth.signOut();
    const out = NextResponse.json({ ok: true });
    copyResponseCookies(base, out);
    return out;
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/auth/logout]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}
