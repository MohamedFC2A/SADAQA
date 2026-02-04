import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "campaign-images";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

function getFileExt(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return { ok: profile?.role === "admin" };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdminUser();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "NO_IMAGE" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: "INVALID_IMAGE_TYPE" }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "IMAGE_TOO_LARGE" }, { status: 400 });
    }

    const ext = getFileExt(file.type);
    if (!ext) {
      return NextResponse.json({ error: "INVALID_IMAGE_TYPE" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const filename = `${randomUUID()}.${ext}`;
    const path = `campaigns/${id}/${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
    }

    const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    const { error: updateError } = await admin
      .from("donation_campaigns")
      .update({ image_url: url })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "DB_UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, image_url: url });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/admin/campaigns/:id/image]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdminUser();
    if (!adminCheck.ok) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("donation_campaigns")
      .update({ image_url: null })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "DB_UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/campaigns/:id/image]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

