import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const schema = z.object({
  id: z.string().uuid(),
  phone: z.string().trim().min(8).max(20),
});

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    id: url.searchParams.get("id"),
    phone: url.searchParams.get("phone"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("requests")
    .select("id,status,updated_at,created_at")
    .eq("id", parsed.data.id)
    .eq("phone", parsed.data.phone)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  });
}
