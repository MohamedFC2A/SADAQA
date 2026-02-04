import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const createSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().int().positive(),
  currency: z.string().trim().min(2).max(8).default("EGP"),
  donor_name: z.string().trim().min(2).max(80).nullable().optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
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
      .from("donations")
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
    console.error("[POST /api/admin/donations]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}
