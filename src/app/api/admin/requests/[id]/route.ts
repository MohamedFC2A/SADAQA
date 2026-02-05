import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  requestStatuses,
  requestTypeLabelAr,
  requestTypes,
  type RequestType,
} from "@/lib/requests/constants";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { requestStatusNotification } from "@/lib/notifications/templates";

export const runtime = "nodejs";

const idSchema = z.string().uuid();

const patchSchema = z.object({
  status: z.enum(requestStatuses).optional(),
  admin_notes: z.string().max(5000).optional(),
  requester_name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  location: z.string().trim().min(2).max(120).optional(),
  request_type: z.enum(requestTypes).optional(),
  description: z.string().trim().min(20).max(2000).optional(),
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

    const admin = createSupabaseAdminClient();

    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const wantsStatusChange = Object.prototype.hasOwnProperty.call(parsed.data, "status");
    const { data: before } = wantsStatusChange
      ? await admin
          .from("requests")
          .select("status,user_id,requester_name,request_type")
          .eq("id", id)
          .maybeSingle()
      : { data: null as any };

    const { data: after, error } = await admin
      .from("requests")
      .update(parsed.data)
      .eq("id", id)
      .select("status,user_id,requester_name,request_type")
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

    if (wantsStatusChange && afterStatus && beforeStatus !== afterStatus && userId) {
      const requesterName =
        typeof (after as any)?.requester_name === "string"
          ? String((after as any).requester_name)
          : null;
      const requestTypeRaw =
        typeof (after as any)?.request_type === "string"
          ? String((after as any).request_type)
          : null;
      const requestType: RequestType | null =
        requestTypeRaw && requestTypes.includes(requestTypeRaw as RequestType)
          ? (requestTypeRaw as RequestType)
          : null;
      const payload = requestStatusNotification({
        nextStatus: afterStatus as any,
        requesterName,
        requestTypeLabel: requestType ? requestTypeLabelAr[requestType] : null,
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
    console.error("[PATCH /api/admin/requests/:id]", { errorId, e });
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
      {
        error: "INTERNAL_ERROR",
        errorId,
        message: e instanceof Error ? e.message : null,
      },
      { status: 500 },
    );
  }
}
