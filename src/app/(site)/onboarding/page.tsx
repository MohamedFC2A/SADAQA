import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { OnboardingForm } from "@/app/(site)/onboarding/onboarding-form";

export const dynamic = "force-dynamic";

type Profile = { name: string; phone: string | null };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(next && next.startsWith("/") ? next : "/onboarding")}`);
  }

  const { data } = await supabase
    .from("profiles")
    .select("name,phone")
    .eq("id", user.id)
    .maybeSingle();

  const profile: Profile = {
    name: typeof data?.name === "string" ? data.name : "",
    phone: typeof data?.phone === "string" ? data.phone : null,
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">إكمال بيانات الحساب</h1>
        <p className="text-muted-foreground">
          لإتمام التبرعات وطلبات المساعدة نحتاج اسمك ورقم الهاتف للتواصل الصحيح.
        </p>
      </div>
      <Card className="p-6">
        <OnboardingForm profile={profile} nextPath={next} />
      </Card>
    </div>
  );
}

