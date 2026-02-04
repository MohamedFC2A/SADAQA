import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { ok: profile?.role === "admin" };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdminUser();
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
      return NextResponse.json({ error: "DB_UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[PATCH /api/admin/campaigns/:id]", { errorId, e });
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
    const adminCheck = await requireAdminUser();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("donation_campaigns").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: "DB_DELETE_FAILED" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/campaigns/:id]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

