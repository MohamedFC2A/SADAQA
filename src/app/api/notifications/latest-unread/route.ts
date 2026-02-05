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

    const { data, error } = await supabase.rpc("get_latest_unread_notification");
    if (error) {
      const msg = error.message ?? "";
      const schemaOutdated =
        msg.includes("get_latest_unread_notification") ||
        msg.toLowerCase().includes("does not exist");
      return NextResponse.json(
        { error: schemaOutdated ? "SCHEMA_OUTDATED" : "DB_ERROR", message: msg },
        { status: 500 },
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      return NextResponse.json({ item: null });
    }

    const obj = row as Record<string, unknown>;
    return NextResponse.json({
      item: {
        id: String(obj["id"] ?? ""),
        title: typeof obj["title"] === "string" ? (obj["title"] as string) : "",
        body: typeof obj["body"] === "string" ? (obj["body"] as string) : "",
        linkUrl: typeof obj["link_url"] === "string" ? (obj["link_url"] as string) : null,
        createdAt: typeof obj["created_at"] === "string" ? (obj["created_at"] as string) : "",
      },
    });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[GET /api/notifications/latest-unread]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

