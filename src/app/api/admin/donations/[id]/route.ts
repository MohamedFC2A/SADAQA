import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { donationStatusNotification } from "@/lib/notifications/templates";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

const patchSchema = z.object({
  amount: z.number().int().positive().optional(),
  donor_name: z.string().trim().min(2).max(80).nullable().optional(),
  phone: z.string().trim().min(8).max(20).nullable().optional(),
  campaign_id: z.string().uuid().optional(),
  payment_method: z
    .enum([
      "vodafone_cash",
      "bank_transfer",
      "whatsapp",
      "fawry",
      "instapay",
      "other",
    ])
    .nullable()
    .optional(),
  status: z.enum(["pending", "verified", "canceled", "proof_sent"]).optional(),
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

    const wantsStatusChange = Object.prototype.hasOwnProperty.call(parsed.data, "status");
    const { data: before } = wantsStatusChange
      ? await admin
          .from("donations")
          .select("status,user_id,payment_code,amount,currency")
          .eq("id", id)
          .maybeSingle()
      : { data: null as any };

    const { data: after, error } = await admin
      .from("donations")
      .update(parsed.data)
      .eq("id", id)
      .select("status,user_id,payment_code,amount,currency")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "DB_UPDATE_FAILED", message: error.message },
        { status: 500 },
      );
    }

    const beforeStatus =
      typeof before?.status === "string" ? (before.status as string) : null;
    const afterStatus =
      typeof (after as any)?.status === "string" ? String((after as any).status) : null;
    const userId =
      typeof (after as any)?.user_id === "string" ? String((after as any).user_id) : null;

    if (wantsStatusChange && beforeStatus && afterStatus && beforeStatus !== afterStatus && userId) {
      const payload = donationStatusNotification({
        nextStatus: afterStatus as any,
        paymentCode:
          typeof (after as any)?.payment_code === "string"
            ? String((after as any).payment_code)
            : null,
        amount:
          typeof (after as any)?.amount === "number" ? (after as any).amount : null,
        currency:
          typeof (after as any)?.currency === "string" ? String((after as any).currency) : null,
      });

      if (payload) {
        await admin.from("notifications").insert({
          scope: "user",
          target_user_id: userId,
          title: payload.title,
          body: payload.body,
          link_url: payload.linkUrl ?? null,
          created_by: adminCheck.userId,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[PATCH /api/admin/donations/:id]", { errorId, e });
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
      {
        error: "INTERNAL_ERROR",
        errorId,
        message: e instanceof Error ? e.message : null,
      },
      { status: 500 },
    );
  }
}
