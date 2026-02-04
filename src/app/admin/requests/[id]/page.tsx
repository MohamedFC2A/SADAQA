import Image from "next/image";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  requestTypeLabelAr,
  statusLabelAr,
  urgencyLabelAr,
  type RequestStatus,
  type RequestType,
  type UrgencyLevel,
} from "@/lib/requests/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RequestEditor } from "@/app/admin/requests/[id]/request-editor";

const BUCKET = "request-images";

type ImageMeta = { path: string; mime: string; size: number };

type RequestRow = {
  id: string;
  requester_name: string;
  phone: string;
  location: string;
  request_type: RequestType;
  urgency_level: UrgencyLevel;
  status: RequestStatus;
  description: string;
  admin_notes: string | null;
  images: ImageMeta[] | null;
  created_at: string;
  updated_at: string;
};

function toneForStatus(status: RequestStatus): "neutral" | "success" | "danger" {
  if (status === "approved" || status === "completed") return "success";
  if (status === "rejected") return "danger";
  return "neutral";
}

function toneForUrgency(
  u: UrgencyLevel,
): "neutral" | "warning" | "danger" {
  if (u === "urgent") return "danger";
  if (u === "high") return "warning";
  return "neutral";
}

export default async function AdminRequestDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const { id } = params;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id,requester_name,phone,location,request_type,urgency_level,status,description,admin_notes,images,created_at,updated_at",
    )
    .eq("id", id)
    .single();

  if (error) {
    notFound();
  }

  const row = data as RequestRow;
  if (!row?.id) notFound();

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
          <div className="text-sm text-black/60 dark:text-white/60">
            ID: <span className="font-mono">{row.id}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={toneForUrgency(row.urgency_level)}>
            {urgencyLabelAr[row.urgency_level]}
          </Badge>
          <Badge tone={toneForStatus(row.status)}>{statusLabelAr[row.status]}</Badge>
          <Badge tone="neutral">{requestTypeLabelAr[row.request_type]}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6 space-y-3">
            <div className="text-sm font-semibold">تفاصيل الحالة</div>
            <div className="text-sm leading-7 text-black/70 dark:text-white/70 whitespace-pre-wrap">
              {row.description}
            </div>
          </Card>

          {signed.length > 0 ? (
            <Card className="p-6 space-y-3">
              <div className="text-sm font-semibold">الصور</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {signed.map((img) => (
                  <div key={img.path} className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
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
              <div className="text-xs text-black/60 dark:text-white/60">
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
              <Badge tone="neutral">الموقع: {row.location}</Badge>
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">
              تم الإنشاء: {new Date(row.created_at).toLocaleString("ar")}
              <div />
              آخر تحديث: {new Date(row.updated_at).toLocaleString("ar")}
            </div>
          </Card>

          <Card className="p-6">
            <RequestEditor
              id={row.id}
              status={row.status}
              urgency_level={row.urgency_level}
              admin_notes={row.admin_notes ?? ""}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
