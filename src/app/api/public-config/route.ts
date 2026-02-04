import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

  return NextResponse.json(
    { supabaseUrl, supabaseAnonKey },
    {
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}

