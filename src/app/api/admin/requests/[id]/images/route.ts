import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminApi } from "@/lib/auth/admin-guard";

export const runtime = "nodejs";

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const BUCKET = "request-images";
const idSchema = z.string().uuid();

type StoredImage = { path: string; mime: string; size: number };

function getFileExt(mime: string): string | null {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

export async function POST(
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

    const form = await request.formData();
    const images = form.getAll("images");
    const files = images.filter((x): x is File => x instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: "NO_IMAGES" }, { status: 400 });
    }
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

    const admin = createSupabaseAdminClient();
    const { data: current, error: currentError } = await admin
      .from("requests")
      .select("images")
      .eq("id", id)
      .single();

    if (currentError) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const existingRaw = (current as { images?: unknown } | null)?.images;
    const existing = Array.isArray(existingRaw)
      ? (existingRaw.filter(Boolean) as StoredImage[])
      : [];

    const uploaded: Array<{ path: string; mime: string; size: number }> = [];
    for (const file of files) {
      const ext = getFileExt(file.type);
      if (!ext) continue;
      const filename = `${randomUUID()}.${ext}`;
      const path = `requests/${id}/${filename}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await admin.storage
        .from(BUCKET)
        .upload(path, bytes, { contentType: file.type, upsert: false });

      if (uploadError) {
        return NextResponse.json({ error: "UPLOAD_FAILED" }, { status: 500 });
      }

      uploaded.push({ path, mime: file.type, size: file.size });
    }

    const nextImages = [...existing, ...uploaded];
    const { error: updateError } = await admin
      .from("requests")
      .update({ images: nextImages })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "DB_UPDATE_FAILED" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, added: uploaded.length });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[POST /api/admin/requests/:id/images]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    const json = (await request.json().catch(() => null)) as unknown;
    const path = (() => {
      if (!json || typeof json !== "object") return "";
      const obj = json as Record<string, unknown>;
      const raw = obj["path"];
      return typeof raw === "string" ? raw : "";
    })();
    if (!path) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();
    const { data: current, error: currentError } = await admin
      .from("requests")
      .select("images")
      .eq("id", id)
      .single();

    if (currentError) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    const existingRaw = (current as { images?: unknown } | null)?.images;
    const existing = Array.isArray(existingRaw)
      ? (existingRaw.filter(Boolean) as StoredImage[])
      : [];

    const nextImages = existing.filter((img) => img?.path !== path);

    const { error: updateError } = await admin
      .from("requests")
      .update({ images: nextImages })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "DB_UPDATE_FAILED" }, { status: 500 });
    }

    await admin.storage.from(BUCKET).remove([path]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    const errorId = randomUUID();
    console.error("[DELETE /api/admin/requests/:id/images]", { errorId, e });
    return NextResponse.json(
      { error: "INTERNAL_ERROR", errorId },
      { status: 500 },
    );
  }
}
