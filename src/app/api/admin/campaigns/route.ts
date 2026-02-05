import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const createSchema = z.object({
  slug: z.string().trim().min(2).max(64),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  currency: z.string().trim().min(2).max(8).default("EGP"),
  min_amount: z.number().int().positive().default(10),
  max_amount: z.number().int().positive().default(100),
  goal_amount: z.number().int().nonnegative().default(10000),
  starts_on: z.string().nullable().optional(),
  ends_on: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  sort_rank: z.number().int().default(0),
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

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("donation_campaigns")
      .insert(parsed.data)
      .select("id")
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        { error: "DB_INSERT_FAILED", message: error?.message ?? null },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/admin/campaigns]", { errorId, e });
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

export async function DELETE() {
  try {
    const adminCheck = await requireAdminApi();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();

    // donation_campaigns is referenced by donations, so purge donations first.
    const { error: donationsError } = await admin
      .from("donations")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (donationsError) {
      return NextResponse.json(
        { error: "DB_DELETE_FAILED", message: donationsError.message },
        { status: 500 },
      );
    }

    const { error: campaignsError } = await admin
      .from("donation_campaigns")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (campaignsError) {
      return NextResponse.json(
        { error: "DB_DELETE_FAILED", message: campaignsError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/campaigns]", { errorId, e });
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
