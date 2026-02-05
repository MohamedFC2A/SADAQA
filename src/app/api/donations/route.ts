import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generatePaymentCode } from "@/lib/donations/payment-code";

export const runtime = "nodejs";

const schema = z.object({
  campaignSlug: z.string().min(1),
  amount: z.number().int().positive(),
  donorName: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  paymentMethod: z
    .enum(["vodafone_cash", "bank_transfer", "whatsapp", "other"])
    .optional(),
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
    const supabaseWithSession = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabaseWithSession.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseWithSession
      .from("profiles")
      .select("name,phone,is_anonymous")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 400 });
    }

    const profileName = typeof profile.name === "string" ? profile.name.trim() : "";
    const profilePhone =
      typeof profile.phone === "string" ? profile.phone.trim() : "";
    if (profileName.length < 2) {
      return NextResponse.json(
        { error: "PROFILE_NAME_REQUIRED", field: "name" },
        { status: 400 },
      );
    }
    if (profilePhone.length < 8) {
      return NextResponse.json(
        { error: "PROFILE_PHONE_REQUIRED", field: "phone" },
        { status: 400 },
      );
    }

    const preferAnonymous = profile?.is_anonymous === true;
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

    let lastInsertError: { message?: string | null } | null = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      const paymentCode = generatePaymentCode();
      const { data: inserted, error: insertError } = await supabase
        .from("donations")
        .insert({
          campaign_id: campaign.id,
          amount: parsed.data.amount,
          currency: campaign.currency,
          donor_name: preferAnonymous
            ? "مجهول"
            : profileName,
          phone: profilePhone,
          payment_code: paymentCode,
          payment_method: parsed.data.paymentMethod ?? null,
          status: "pending",
          user_id: user.id,
          is_anonymous: preferAnonymous,
        })
        .select("id,payment_code")
        .single();

      if (!insertError && inserted?.id && inserted.payment_code) {
        return NextResponse.json(
          { id: inserted.id, paymentCode: inserted.payment_code },
          { status: 201 },
        );
      }

      lastInsertError = insertError;
      const msg = insertError?.message?.toLowerCase() ?? "";
      const isUniqueViolation =
        msg.includes("duplicate") ||
        msg.includes("unique") ||
        msg.includes("donations_payment_code_key");

      const missingAnon =
        insertError?.message?.includes('column "is_anonymous"') ?? false;
      const missingUserId =
        insertError?.message?.includes('column "user_id"') ?? false;

      if (missingAnon || missingUserId) {
        const { data: insertedFallback, error: fallbackError } = await supabase
          .from("donations")
          .insert({
            campaign_id: campaign.id,
            amount: parsed.data.amount,
            currency: campaign.currency,
            donor_name: preferAnonymous
              ? "مجهول"
              : profileName,
            phone: profilePhone,
            payment_code: paymentCode,
            payment_method: parsed.data.paymentMethod ?? null,
            status: "pending",
            ...(missingUserId ? {} : { user_id: user.id }),
            ...(missingAnon ? {} : { is_anonymous: preferAnonymous }),
          })
          .select("id,payment_code")
          .single();

        if (!fallbackError && insertedFallback?.id && insertedFallback.payment_code) {
          return NextResponse.json(
            { id: insertedFallback.id, paymentCode: insertedFallback.payment_code },
            { status: 201 },
          );
        }

        lastInsertError = fallbackError;
        if (!fallbackError) break;
      }

      if (!isUniqueViolation) break;
    }

    const message = lastInsertError?.message ?? null;
    const schemaOutdated =
      typeof message === "string" &&
      (message.includes('column "payment_code"') ||
        message.includes('column "payment_method"') ||
        message.includes('column "status"'));

    return NextResponse.json(
      {
        error: schemaOutdated ? "SCHEMA_OUTDATED" : "DB_INSERT_FAILED",
        message,
      },
      { status: 500 },
    );
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/donations]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}
