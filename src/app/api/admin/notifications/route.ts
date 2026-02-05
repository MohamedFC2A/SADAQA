import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const createSchema = z.object({
  scope: z.enum(["global", "user"]),
  targetUserId: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(5).max(5000),
  linkUrl: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdminApi();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const json = (await request.json().catch(() => null)) as unknown;
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (parsed.data.scope === "user" && !parsed.data.targetUserId) {
      return NextResponse.json(
        { error: "TARGET_USER_REQUIRED" },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .insert({
        scope: parsed.data.scope,
        target_user_id: parsed.data.scope === "user" ? parsed.data.targetUserId : null,
        title: parsed.data.title,
        body: parsed.data.body,
        link_url: parsed.data.linkUrl?.trim() ? parsed.data.linkUrl.trim() : null,
        created_by: adminCheck.userId,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { error: "DB_INSERT_FAILED", message: error?.message ?? null },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, id: String(data.id) }, { status: 201 });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/admin/notifications]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

export async function GET() {
  try {
    const adminCheck = await requireAdminApi();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("notifications")
      .select("id,scope,target_user_id,title,body,link_url,created_at,created_by")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: "DB_ERROR", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ items: data ?? [] });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[GET /api/admin/notifications]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

