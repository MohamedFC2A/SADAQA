import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data, error } = await supabase.rpc("get_unread_notification_count");
    if (error) {
      const msg = error.message ?? "";
      const schemaOutdated =
        msg.includes("get_unread_notification_count") ||
        msg.toLowerCase().includes("does not exist");
      return NextResponse.json(
        { error: schemaOutdated ? "SCHEMA_OUTDATED" : "DB_ERROR", message: msg },
        { status: 500 },
      );
    }

    const count = typeof data === "number" ? data : Number(data ?? 0) || 0;
    return NextResponse.json({ count });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[GET /api/notifications/unread-count]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

