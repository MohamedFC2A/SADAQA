import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { supabase, applyCookies } = createSupabaseRouteHandlerClient(request);
    await supabase.auth.signOut();
    const out = NextResponse.json({ ok: true });
    applyCookies(out);
    return out;
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/auth/logout]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}
