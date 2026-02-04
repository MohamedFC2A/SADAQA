import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  campaignSlug: z.string().min(1),
  amount: z.number().int().positive(),
  donorName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data: campaign, error: campaignError } = await supabase
      .from("donation_campaigns")
      .select("id,slug,min_amount,max_amount,currency,is_active")
      .eq("slug", parsed.data.campaignSlug)
      .single();

    if (campaignError || !campaign || !campaign.is_active) {
      return NextResponse.json(
        { error: "CAMPAIGN_NOT_FOUND" },
        { status: 404 },
      );
    }

    const min = Number(campaign.min_amount);
    const max = Number(campaign.max_amount);
    if (parsed.data.amount < min || parsed.data.amount > max) {
      return NextResponse.json(
        { error: "AMOUNT_OUT_OF_RANGE", min, max },
        { status: 400 },
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("donations")
      .insert({
        campaign_id: campaign.id,
        amount: parsed.data.amount,
        currency: campaign.currency,
        donor_name: parsed.data.donorName ?? null,
        phone: parsed.data.phone ?? null,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      return NextResponse.json({ error: "DB_INSERT_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/donations]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

