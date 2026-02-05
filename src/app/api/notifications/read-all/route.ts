import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("mark_all_notifications_read");
    if (error) {
      const msg = error.message ?? "";
      const schemaOutdated =
        msg.includes("mark_all_notifications_read") ||
        msg.toLowerCase().includes("does not exist");
      return NextResponse.json(
        { error: schemaOutdated ? "SCHEMA_OUTDATED" : "DB_ERROR", message: msg },
        { status: 500 },
      );
    }

    const affected = typeof data === "number" ? data : Number(data ?? 0) || 0;
    return NextResponse.json({ ok: true, affected });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/notifications/read-all]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

