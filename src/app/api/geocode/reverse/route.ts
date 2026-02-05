import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const schema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

function pickGovernorate(address: Record<string, unknown> | null): string | null {
  if (!address) return null;
  const state = typeof address["state"] === "string" ? (address["state"] as string) : null;
  const county =
    typeof address["county"] === "string" ? (address["county"] as string) : null;
  const city = typeof address["city"] === "string" ? (address["city"] as string) : null;
  return state ?? county ?? city ?? null;
}

function buildAddressDetail(address: Record<string, unknown> | null): string | null {
  if (!address) return null;
  const parts = [
    "road",
    "neighbourhood",
    "suburb",
    "city_district",
    "city",
    "town",
    "village",
  ]
    .map((k) => (typeof address[k] === "string" ? (address[k] as string).trim() : ""))
    .filter(Boolean);

  const unique: string[] = [];
  for (const p of parts) {
    if (unique.includes(p)) continue;
    unique.push(p);
  }

  if (unique.length === 0) return null;
  return unique.join("، ");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = schema.safeParse({
    lat: url.searchParams.get("lat"),
    lng: url.searchParams.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  reverseUrl.searchParams.set("format", "jsonv2");
  reverseUrl.searchParams.set("lat", String(parsed.data.lat));
  reverseUrl.searchParams.set("lon", String(parsed.data.lng));
  reverseUrl.searchParams.set("zoom", "18");
  reverseUrl.searchParams.set("addressdetails", "1");
  reverseUrl.searchParams.set("accept-language", "ar");

  const res = await fetch(reverseUrl.toString(), {
    headers: {
      "user-agent": "ALZAKA-MADDAD/1.0 (reverse-geocode)",
      accept: "application/json",
    },
    cache: "force-cache",
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "UPSTREAM_FAILED" }, { status: 502 });
  }

  const data = (await res.json().catch(() => null)) as unknown;
  if (!data || typeof data !== "object") {
    return NextResponse.json({ error: "UPSTREAM_INVALID" }, { status: 502 });
  }

  const obj = data as Record<string, unknown>;
  const displayName =
    typeof obj["display_name"] === "string" ? (obj["display_name"] as string) : null;
  const address = (obj["address"] ?? null) as Record<string, unknown> | null;

  const governorate = pickGovernorate(address);
  const addressDetail = buildAddressDetail(address) ?? displayName;

  return NextResponse.json(
    { displayName, governorate, addressDetail },
    {
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}

