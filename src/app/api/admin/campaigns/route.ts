import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdminUser();
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
      return NextResponse.json({ error: "DB_INSERT_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/admin/campaigns]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

