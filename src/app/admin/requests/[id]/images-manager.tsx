"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Img = { path: string; url: string };

type State =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "error"; message: string }
  | { kind: "done"; message: string };

export function ImagesManager({
  requestId,
  images,
}: {
  requestId: string;
  images: Img[];
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [files, setFiles] = useState<File[]>([]);

  const canUpload = useMemo(() => {
    if (state.kind === "uploading") return false;
    return files.length > 0;
  }, [files.length, state.kind]);

  async function upload() {
    setState({ kind: "uploading" });
    try {
      const form = new FormData();
      for (const file of files.slice(0, 5)) {
        form.append("images", file);
      }
      const res = await fetch(`/api/admin/requests/${requestId}/images`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setState({ kind: "error", message: "تعذر رفع الصور." });
        return;
      }
      setState({ kind: "done", message: "تم رفع الصور." });
      setFiles([]);
      router.refresh();
      setTimeout(() => setState({ kind: "idle" }), 1200);
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  async function remove(path: string) {
    setState({ kind: "uploading" });
    try {
      const res = await fetch(`/api/admin/requests/${requestId}/images`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!res.ok) {
        setState({ kind: "error", message: "تعذر حذف الصورة." });
        return;
      }
      setState({ kind: "done", message: "تم حذف الصورة." });
      router.refresh();
      setTimeout(() => setState({ kind: "idle" }), 1200);
    } catch {
      setState({ kind: "error", message: "حدث خطأ غير متوقع." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-semibold">إدارة الصور</div>

      <div className="space-y-2">
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            حد أقصى 5 صور (2MB لكل صورة).
          </div>
          <Button type="button" variant="secondary" onClick={upload} disabled={!canUpload}>
            {state.kind === "uploading" ? "جارٍ الرفع..." : "رفع"}
          </Button>
        </div>
      </div>

      {state.kind === "error" ? (
        <div className="rounded-xl border border-pal-red/30 bg-pal-red/10 p-3 text-sm text-pal-red">
          {state.message}
        </div>
      ) : null}
      {state.kind === "done" ? (
        <div className="rounded-xl border border-pal-green/30 bg-pal-green/10 p-3 text-sm text-pal-green">
          {state.message}
        </div>
      ) : null}

      {images.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {images.map((img) => (
            <div
              key={img.path}
              className="overflow-hidden rounded-xl border border-border"
            >
              <div className="relative h-40 w-full">
                <Image
                  src={img.url}
                  alt="صورة"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex items-center justify-between gap-2 p-3">
                <div className="truncate text-xs text-muted-foreground">
                  {img.path}
                </div>
                <button
                  type="button"
                  onClick={() => remove(img.path)}
                  className="text-xs font-semibold text-pal-red hover:underline"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          لا توجد صور مرفقة.
        </div>
      )}
    </div>
  );
}
