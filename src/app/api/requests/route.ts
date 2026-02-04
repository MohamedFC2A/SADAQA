import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requestHelpSchema } from "@/lib/validation/request-help";

export const runtime = "nodejs";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const BUCKET = "request-images";

function getFileExt(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();

    const parsed = requestHelpSchema.safeParse({
      requester_name: form.get("requester_name"),
      phone: form.get("phone"),
      location: form.get("location"),
      request_type: form.get("request_type"),
      description: form.get("description"),
      urgency_level: form.get("urgency_level") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const images = form.getAll("images");
    const files = images.filter((x): x is File => x instanceof File);
    if (files.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: "TOO_MANY_IMAGES", max: MAX_IMAGES },
        { status: 400 },
      );
    }

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: "INVALID_IMAGE_TYPE", mime: file.type },
          { status: 400 },
        );
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: "IMAGE_TOO_LARGE", maxBytes: MAX_IMAGE_BYTES },
          { status: 400 },
        );
      }
    }

    const supabase = createSupabaseAdminClient();

    const { data: inserted, error: insertError } = await supabase
      .from("requests")
      .insert({
        requester_name: parsed.data.requester_name,
        phone: parsed.data.phone,
        location: parsed.data.location,
        request_type: parsed.data.request_type,
        description: parsed.data.description,
        urgency_level: parsed.data.urgency_level ?? "medium",
        images: [],
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      return NextResponse.json(
        { error: "DB_INSERT_FAILED" },
        { status: 500 },
      );
    }

    const requestId = inserted.id as string;

    const uploaded: Array<{ path: string; mime: string; size: number }> = [];
    for (const file of files) {
      const ext = getFileExt(file.type);
      if (!ext) continue;

      const filename = `${randomUUID()}.${ext}`;
      const path = `requests/${requestId}/${filename}`;

      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: file.type, upsert: false });

      if (uploadError) {
        return NextResponse.json(
          { error: "UPLOAD_FAILED" },
          { status: 500 },
        );
      }

      uploaded.push({ path, mime: file.type, size: file.size });
    }

    if (uploaded.length > 0) {
      const { error: updateError } = await supabase
        .from("requests")
        .update({ images: uploaded })
        .eq("id", requestId);

      if (updateError) {
        return NextResponse.json(
          { error: "DB_UPDATE_FAILED" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ id: requestId }, { status: 201 });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/requests]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

