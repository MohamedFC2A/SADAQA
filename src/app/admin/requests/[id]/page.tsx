import Image from "next/image";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  requestTypeLabelAr,
  statusLabelAr,
  type RequestStatus,
  type RequestType,
} from "@/lib/requests/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestEditor } from "@/app/admin/requests/[id]/request-editor";
import { ImagesManager } from "@/app/admin/requests/[id]/images-manager";

const BUCKET = "request-images";

type ImageMeta = { path: string; mime: string; size: number };

type RequestRow = {
  id: string;
  requester_name: string;
  phone: string;
  location: string;
  request_type: RequestType;
  status: RequestStatus;
  description: string;
  admin_notes: string | null;
  images: ImageMeta[] | null;
  created_at: string;
  updated_at: string;
  governorate: string | null;
  address_detail: string | null;
  location_lat: number | null;
  location_lng: number | null;
};

function toneForStatus(status: RequestStatus): "neutral" | "success" | "danger" {
  if (status === "approved" || status === "completed") return "success";
  if (status === "rejected") return "danger";
  return "neutral";
}

export default async function AdminRequestDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id,requester_name,phone,location,request_type,status,description,admin_notes,images,created_at,updated_at,governorate,address_detail,location_lat,location_lng",
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="p-6 space-y-2">
          <div className="text-xl font-semibold">تعذر تحميل الطلب</div>
          <div className="text-sm text-muted-foreground">
            {error?.message ? (
              <>
                الخطأ: <span className="font-mono">{error.message}</span>
                <div className="mt-2" />
              </>
            ) : null}
            غالباً قاعدة البيانات غير مُحدّثة أو مفاتيح Supabase على Vercel تشير
            لمشروع مختلف. شغّل{" "}
            <span className="font-mono">supabase/schema.sql</span> داخل Supabase
            SQL Editor للمشروع الصحيح ثم أعد المحاولة.
          </div>
        </Card>
      </div>
    );
  }

  const row = data as RequestRow;

  const images = (row.images ?? []).filter((x): x is ImageMeta => Boolean(x?.path));
  const signed: Array<{ path: string; url: string; mime: string; size: number }> = [];
  for (const img of images) {
    const { data: signedUrlData } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(img.path, 60 * 60);
    if (signedUrlData?.signedUrl) {
      signed.push({ ...img, url: signedUrlData.signedUrl });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">{row.requester_name}</h1>
          <div className="text-sm text-muted-foreground">
            ID: <span className="font-mono">{row.id}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={toneForStatus(row.status)}>{statusLabelAr[row.status]}</Badge>
          <Badge tone="neutral">{requestTypeLabelAr[row.request_type]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6 space-y-3">
            <div className="text-sm font-semibold">تفاصيل الحالة</div>
            <div className="text-sm leading-7 text-muted-foreground whitespace-pre-wrap">
              {row.description}
            </div>
          </Card>

          {signed.length > 0 ? (
            <Card className="p-6 space-y-3">
              <div className="text-sm font-semibold">الصور</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {signed.map((img) => (
                  <div key={img.path} className="overflow-hidden rounded-xl border border-border">
                    <Image
                      src={img.url}
                      alt="صورة مرفقة"
                      width={800}
                      height={600}
                      className="h-48 w-full object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                الروابط موقعة وتنتهي تلقائياً خلال ساعة.
              </div>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-3">
            <div className="text-sm font-semibold">معلومات أساسية</div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">الهاتف: {row.phone}</Badge>
              {row.governorate ? (
                <Badge tone="neutral">المحافظة: {row.governorate}</Badge>
              ) : null}
              {row.address_detail ? (
                <Badge tone="neutral">العنوان: {row.address_detail}</Badge>
              ) : (
                <Badge tone="neutral">الموقع: {row.location}</Badge>
              )}
              {typeof row.location_lat === "number" &&
              typeof row.location_lng === "number" ? (
                <a
                  className="inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-pal-green hover:underline"
                  href={`https://www.google.com/maps?q=${encodeURIComponent(`${row.location_lat},${row.location_lng}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  فتح GPS على الخريطة
                </a>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground">
              تم الإنشاء: {new Date(row.created_at).toLocaleString("ar")}
              <div />
              آخر تحديث: {new Date(row.updated_at).toLocaleString("ar")}
            </div>
          </Card>

          <Card className="p-6">
            <RequestEditor
              id={row.id}
              status={row.status}
              admin_notes={row.admin_notes ?? ""}
              requester_name={row.requester_name}
              phone={row.phone}
              location={row.location}
              request_type={row.request_type}
              description={row.description}
            />
          </Card>

          <Card className="p-6">
            <ImagesManager
              requestId={row.id}
              images={signed.map((img) => ({ path: img.path, url: img.url }))}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
