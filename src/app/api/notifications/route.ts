import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).max(5000).optional(),
});

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  linkUrl: string | null;
  createdAt: string;
  scope: "global" | "user";
  isRead: boolean;
  readAt: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const url = new URL(request.url);
    const parsedQuery = querySchema.safeParse({
      limit: url.searchParams.get("limit"),
      offset: url.searchParams.get("offset"),
    });
    const limit = parsedQuery.success ? parsedQuery.data.limit ?? 50 : 50;
    const offset = parsedQuery.success ? parsedQuery.data.offset ?? 0 : 0;

    const { data, error } = await supabase.rpc("list_notifications", {
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      const msg = error.message ?? "";
      const schemaOutdated =
        msg.includes("list_notifications") || msg.toLowerCase().includes("does not exist");
      return NextResponse.json(
        { error: schemaOutdated ? "SCHEMA_OUTDATED" : "DB_ERROR", message: msg },
        { status: 500 },
      );
    }

    const rows = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    const items: NotificationItem[] = rows.map((r) => ({
      id: String(r["id"] ?? ""),
      title: typeof r["title"] === "string" ? (r["title"] as string) : "",
      body: typeof r["body"] === "string" ? (r["body"] as string) : "",
      linkUrl: typeof r["link_url"] === "string" ? (r["link_url"] as string) : null,
      createdAt: typeof r["created_at"] === "string" ? (r["created_at"] as string) : "",
      scope: (r["scope"] === "user" ? "user" : "global") as "global" | "user",
      isRead: r["is_read"] === true,
      readAt: typeof r["read_at"] === "string" ? (r["read_at"] as string) : null,
    }));

    return NextResponse.json({ items });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[GET /api/notifications]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

