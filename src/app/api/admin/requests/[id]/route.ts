import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestStatuses, urgencyLevels } from "@/lib/requests/constants";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(requestStatuses).optional(),
  urgency_level: z.enum(urgencyLevels).optional(),
  admin_notes: z.string().max(5000).optional(),
  requester_name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  request_type: z
    .enum(["money", "food", "clothes", "medical", "education", "housing"])
    .optional(),
  description: z.string().trim().min(20).max(2000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdminApi();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { error } = await admin
      .from("requests")
      .update(parsed.data)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "DB_UPDATE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[PATCH /api/admin/requests/:id]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdminApi();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("requests").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "DB_DELETE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/requests/:id]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}
