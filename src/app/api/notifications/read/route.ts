import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({ id: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const json = (await request.json().catch(() => null)) as unknown;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("notification_reads").insert({
      notification_id: parsed.data.id,
      user_id: user.id,
      read_at: new Date().toISOString(),
    });

    if (error) {
      const msg = error.message ?? "";
      const isDuplicate = msg.toLowerCase().includes("duplicate") || msg.includes("23505");
      const schemaOutdated = msg.toLowerCase().includes("notification_reads") && msg.toLowerCase().includes("does not exist");
      if (!isDuplicate) {
        return NextResponse.json(
          { error: schemaOutdated ? "SCHEMA_OUTDATED" : "DB_INSERT_FAILED", message: msg },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/notifications/read]", { errorId, e });
    return NextResponse.json({ error: "INTERNAL_ERROR", errorId }, { status: 500 });
  }
}

