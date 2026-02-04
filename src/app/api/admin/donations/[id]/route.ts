import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const patchSchema = z.object({
  amount: z.number().int().positive().optional(),
  donor_name: z.string().trim().min(2).max(80).nullable().optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  campaign_id: z.string().uuid().optional(),
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

    const json = (await request.json().catch(() => null)) as unknown;
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("donations").update(parsed.data).eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "DB_UPDATE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[PATCH /api/admin/donations/:id]", { errorId, e });
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
    const { error } = await admin.from("donations").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "DB_DELETE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/donations/:id]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}
