import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestStatuses, urgencyLevels } from "@/lib/requests/constants";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(requestStatuses).optional(),
  urgency_level: z.enum(urgencyLevels).optional(),
  admin_notes: z.string().max(5000).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { error } = await admin
      .from("requests")
      .update(parsed.data)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "DB_UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[PATCH /api/admin/requests/:id]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}
