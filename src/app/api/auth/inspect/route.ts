import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const cookieNames = cookieStore.getAll().map((c) => c.name);

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authed: false, cookieNames });
  }

  return NextResponse.json({ authed: true, userId: user.id, cookieNames });
}

