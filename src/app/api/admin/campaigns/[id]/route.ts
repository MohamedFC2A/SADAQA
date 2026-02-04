import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

const patchSchema = z.object({
  slug: z.string().trim().min(2).max(64).optional(),
  title: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  currency: z.string().trim().min(2).max(8).optional(),
  min_amount: z.number().int().positive().optional(),
  max_amount: z.number().int().positive().optional(),
  goal_amount: z.number().int().nonnegative().optional(),
  starts_on: z.string().nullable().optional(),
  ends_on: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  image_url: z.string().trim().max(500).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const idParsed = idSchema.safeParse(rawId);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: "INVALID_ID", received: rawId },
        { status: 400 },
      );
    }
    const id = idParsed.data;

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
    const { error } = await admin
      .from("donation_campaigns")
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
    console.error("[PATCH /api/admin/campaigns/:id]", { errorId, e });
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        errorId,
        message: e instanceof Error ? e.message : null,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await context.params;
    const idParsed = idSchema.safeParse(rawId);
    if (!idParsed.success) {
      return NextResponse.json(
        { error: "INVALID_ID", received: rawId },
        { status: 400 },
      );
    }
    const id = idParsed.data;

    const adminCheck = await requireAdminApi();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("donation_campaigns").delete().eq("id", id);
    if (error) {
      return NextResponse.json(
        { error: "DB_DELETE_FAILED", message: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/campaigns/:id]", { errorId, e });
    return NextResponse.json(
      {
        error: "INTERNAL_ERROR",
        errorId,
        message: e instanceof Error ? e.message : null,
      },
      { status: 500 },
    );
  }
}
