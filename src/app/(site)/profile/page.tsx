import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ProfileClient } from "@/app/(site)/profile/profile-client";

export const dynamic = "force-dynamic";

type Profile = {
  id: string;
  name: string;
  phone: string | null;
  isAnonymous: boolean;
  createdAt: string | null;
};

type RequestItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  urgency: string;
  createdAt: string;
  isAnonymous: boolean;
};

type DonationItem = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentCode: string | null;
  createdAt: string;
  isAnonymous: boolean;
};

function mapProfile(row: Record<string, unknown> | null): Profile {
  return {
    id: row?.["id"] ? String(row["id"]) : "",
    name: typeof row?.["name"] === "string" ? (row["name"] as string) : "",
    phone: typeof row?.["phone"] === "string" ? (row["phone"] as string) : null,
    isAnonymous: row?.["is_anonymous"] === true,
    createdAt:
      typeof row?.["created_at"] === "string" ? (row["created_at"] as string) : null,
  };
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/profile");
  }

  const admin = createSupabaseAdminClient();

  const { data: profileData, error: profileError } = await admin
    .from("profiles")
    .select("id,name,phone,is_anonymous,created_at")
    .eq("id", user.id)
    .single();

  const profileMissingAnon =
    profileError?.message?.includes('column "is_anonymous"') ?? false;

  const profileFallback = profileMissingAnon
    ? await admin
        .from("profiles")
        .select("id,name,phone,created_at")
        .eq("id", user.id)
        .single()
    : null;

  const profile = mapProfile(
    (profileMissingAnon ? profileFallback?.data : profileData) ?? null,
  );

  const warnings: string[] = [];
  if (profileMissingAnon) {
    warnings.push(
      "حقل is_anonymous غير موجود في جدول profiles. شغّل ملف supabase/schema.sql لتحديث القاعدة.",
    );
  } else if (profileError) {
    warnings.push(`تعذر جلب البروفايل: ${profileError.message}`);
  }

  const { data: requestsData, error: requestsError } = await admin
    .from("requests")
    .select(
      "id,requester_name,request_type,urgency_level,status,created_at,is_anonymous",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const requestsMissingUserId =
    requestsError?.message?.includes('column "user_id"') ?? false;
  const requestsMissingAnon =
    requestsError?.message?.includes('column "is_anonymous"') ?? false;

  if (requestsMissingUserId) {
    warnings.push(
      "حقل user_id غير موجود في جدول requests، لذلك لا يمكن عرض طلباتك الشخصية. حدث القاعدة عبر supabase/schema.sql.",
    );
  } else if (requestsError && !requestsMissingAnon) {
    warnings.push(`تعذر جلب الطلبات: ${requestsError.message}`);
  }

  const fallbackRequests = requestsMissingAnon
    ? await admin
        .from("requests")
        .select(
          "id,requester_name,request_type,urgency_level,status,created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : null;

  const requestsRows =
    requestsMissingUserId || requestsError?.code === "PGRST116"
      ? []
      : (requestsMissingAnon ? fallbackRequests?.data : requestsData) ?? [];

  const requests: RequestItem[] = (requestsRows as Array<Record<string, unknown>>).map(
    (row) => ({
      id: String(row["id"] ?? ""),
      name: typeof row["requester_name"] === "string" ? (row["requester_name"] as string) : "—",
      type: String(row["request_type"] ?? ""),
      status: String(row["status"] ?? "pending"),
      urgency: String(row["urgency_level"] ?? "medium"),
      createdAt: String(row["created_at"] ?? ""),
      isAnonymous: row["is_anonymous"] === true,
    }),
  );

  const { data: donationsData, error: donationsError } = await admin
    .from("donations")
    .select(
      "id,amount,currency,status,payment_code,payment_method,created_at,is_anonymous",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const donationsMissingUserId =
    donationsError?.message?.includes('column "user_id"') ?? false;
  const donationsMissingAnon =
    donationsError?.message?.includes('column "is_anonymous"') ?? false;

  if (donationsMissingUserId) {
    warnings.push(
      "حقل user_id غير موجود في جدول donations. حدث القاعدة عبر supabase/schema.sql لربط التبرعات بالمستخدم.",
    );
  } else if (donationsError && !donationsMissingAnon) {
    warnings.push(`تعذر جلب تبرعاتك: ${donationsError.message}`);
  }

  const fallbackDonations = donationsMissingAnon
    ? await admin
        .from("donations")
        .select("id,amount,currency,status,payment_code,payment_method,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
    : null;

  const donationsRows =
    donationsMissingUserId || donationsError?.code === "PGRST116"
      ? []
      : (donationsMissingAnon ? fallbackDonations?.data : donationsData) ?? [];

  const donations: DonationItem[] = (donationsRows as Array<Record<string, unknown>>).map(
    (row) => ({
      id: String(row["id"] ?? ""),
      amount: Number(row["amount"] ?? 0),
      currency: String(row["currency"] ?? "EGP"),
      status: String(row["status"] ?? "pending"),
      paymentMethod:
        typeof row["payment_method"] === "string" ? (row["payment_method"] as string) : null,
      paymentCode:
        typeof row["payment_code"] === "string" ? (row["payment_code"] as string) : null,
      createdAt: String(row["created_at"] ?? ""),
      isAnonymous: row["is_anonymous"] === true,
    }),
  );

  return (
    <ProfileClient
      profile={profile}
      requests={requests}
      donations={donations}
      warnings={warnings}
    />
  );
}
