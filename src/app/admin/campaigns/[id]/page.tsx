import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/card";
import { CampaignEditor } from "@/app/admin/campaigns/[id]/campaign-editor";

type CampaignRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string | null;
  currency: string;
  min_amount: number;
  max_amount: number;
  goal_amount: number;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  sort_rank: number;
};

export default async function AdminCampaignDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) return null;

  const { id } = await params;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("donation_campaigns")
    .select(
      "id,slug,title,description,image_url,currency,min_amount,max_amount,goal_amount,starts_on,ends_on,is_active,is_featured,is_new,sort_rank",
    )
    .eq("id", id)
    .single();

  const schemaOutdated =
    error?.message?.includes('column "image_url"') ||
    error?.message?.includes('column "goal_amount"') ||
    error?.message?.includes('column "is_featured"') ||
    error?.message?.includes('column "is_new"') ||
    error?.message?.includes('column "sort_rank"');

  const { data: fallbackData, error: fallbackError } = schemaOutdated
    ? await supabase
        .from("donation_campaigns")
        .select(
          "id,slug,title,description,currency,min_amount,max_amount,starts_on,ends_on,is_active",
        )
        .eq("id", id)
        .single()
    : { data: null as unknown, error: null as unknown };

  const raw = (schemaOutdated ? fallbackData : data) as unknown;
  const rawError = (schemaOutdated ? fallbackError : error) as unknown;
  const rawObj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;

  const finalData: CampaignRow | null = rawObj
    ? {
        id: String(rawObj["id"] ?? ""),
        slug: String(rawObj["slug"] ?? ""),
        title: String(rawObj["title"] ?? ""),
        description:
          typeof rawObj["description"] === "string"
            ? rawObj["description"]
            : null,
        image_url:
          typeof rawObj["image_url"] === "string" ? rawObj["image_url"] : null,
        currency: String(rawObj["currency"] ?? "EGP"),
        min_amount: Number(rawObj["min_amount"] ?? 10),
        max_amount: Number(rawObj["max_amount"] ?? 100),
        goal_amount: Number(rawObj["goal_amount"] ?? 10000),
        starts_on:
          typeof rawObj["starts_on"] === "string" ? rawObj["starts_on"] : null,
        ends_on:
          typeof rawObj["ends_on"] === "string" ? rawObj["ends_on"] : null,
        is_active: Boolean(rawObj["is_active"]),
        is_featured: rawObj["is_featured"] === true,
        is_new: rawObj["is_new"] === true,
        sort_rank: Number(rawObj["sort_rank"] ?? 0),
      }
    : null;

  if (!finalData) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Card className="p-6 space-y-2">
          <div className="text-xl font-semibold">تعذر تحميل الحملة</div>
          <div className="text-sm text-black/70 dark:text-white/70">
            {schemaOutdated ? (
              <>
                قاعدة البيانات ناقصة أعمدة. الخطأ:{" "}
                <span className="font-mono">{error?.message}</span>
                <div className="mt-2">
                  شغّل <span className="font-mono">supabase/schema.sql</span>{" "}
                  داخل Supabase SQL Editor ثم أعد المحاولة.
                </div>
              </>
            ) : (
              <>
                {rawError && typeof rawError === "object" && "message" in rawError ? (
                  <>
                    خطأ:{" "}
                    <span className="font-mono">
                      {(() => {
                        const obj = rawError as Record<string, unknown>;
                        return typeof obj["message"] === "string"
                          ? obj["message"]
                          : "Unknown error";
                      })()}
                    </span>
                  </>
                ) : (
                  <>لم يتم العثور على الحملة.</>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold">تعديل الحملة</h1>
        <div className="text-sm text-black/60 dark:text-white/60">
          ID: <span className="font-mono">{id}</span>
        </div>
      </div>
      <Card className="p-6">
        <CampaignEditor campaign={finalData} />
        {schemaOutdated ? (
          <div className="mt-4 rounded-xl border border-pal-gold/30 bg-pal-gold/10 p-3 text-xs text-black/70 dark:text-white/70">
            قاعدة البيانات ناقصة أعمدة (مثل <span className="font-mono">image_url</span>{" "}
            أو <span className="font-mono">goal_amount</span>). شغّل{" "}
            <span className="font-mono">supabase/schema.sql</span> داخل Supabase SQL Editor.
          </div>
        ) : null}
      </Card>
    </div>
  );
}
