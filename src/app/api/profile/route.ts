import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  isAnonymous: z.boolean().optional(),
});

type Profile = {
  id: string;
  name: string;
  phone: string | null;
  isAnonymous: boolean;
  createdAt: string | null;
};

function mapProfile(row: Record<string, unknown> | null): Profile {
  return {
    id: typeof row?.["id"] === "string" ? row!["id"] : "",
    name: typeof row?.["name"] === "string" ? row!["name"] : "",
    phone: typeof row?.["phone"] === "string" ? (row!["phone"] as string) : null,
    isAnonymous: row?.["is_anonymous"] === true,
    createdAt:
      typeof row?.["created_at"] === "string" ? (row!["created_at"] as string) : null,
  };
}

async function getUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  return { ok: true as const, userId: user.id, supabase };
}

export async function GET() {
  const session = await getUserId();
  if (!session.ok) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { supabase, userId } = session;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,phone,is_anonymous,created_at")
    .eq("id", userId)
    .single();

  const missingAnon =
    error?.message?.includes('column "is_anonymous"') ?? false;

  const fallback = missingAnon
    ? await supabase
        .from("profiles")
        .select("id,name,phone,created_at")
        .eq("id", userId)
        .single()
    : null;

  const profile = mapProfile((missingAnon ? fallback?.data : data) ?? null);

  if (error && !missingAnon) {
    return NextResponse.json(
      { error: "DB_ERROR", message: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await getUserId();
  if (!session.ok) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_INPUT", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updates: Record<string, unknown> = {};
  if (Object.prototype.hasOwnProperty.call(parsed.data, "name")) {
    updates.name = parsed.data.name;
  }
  if (Object.prototype.hasOwnProperty.call(parsed.data, "isAnonymous")) {
    updates.is_anonymous = parsed.data.isAnonymous;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = Object.keys(updates).length
    ? await admin
        .from("profiles")
        .update(updates)
        .eq("id", session.userId)
        .select("id,name,phone,is_anonymous,created_at")
        .single()
    : await admin
        .from("profiles")
        .select("id,name,phone,is_anonymous,created_at")
        .eq("id", session.userId)
        .single();

  const missingAnon =
    error?.message?.includes('column "is_anonymous"') ?? false;

  const fallback =
    missingAnon && Object.keys(updates).length
      ? await admin
          .from("profiles")
          .update((() => {
            const copy = { ...updates };
            delete (copy as Record<string, unknown>).is_anonymous;
            return copy;
          })())
          .eq("id", session.userId)
          .select("id,name,phone,created_at")
          .single()
      : missingAnon
        ? await admin
            .from("profiles")
            .select("id,name,phone,created_at")
            .eq("id", session.userId)
            .single()
        : null;

  if (error && !missingAnon) {
    return NextResponse.json(
      { error: "DB_UPDATE_FAILED", message: error.message },
      { status: 500 },
    );
  }

  const profile = mapProfile((missingAnon ? fallback?.data : data) ?? null);
  return NextResponse.json({ profile });
}
