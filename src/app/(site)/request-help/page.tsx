import { Card } from "@/components/ui/card";
import { RequestHelpForm } from "@/app/(site)/request-help/request-help-form";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function RequestHelpPage() {
  // This page requires an authenticated user so we can trust name/phone from profile.
  // (Name/phone are not editable inside the request form.)
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">طلب مساعدة عاجلة</h1>
        <p className="text-muted-foreground">
          عبئ البيانات بدقة لنوصل الدعم الصحيح بأسرع وقت. اسمك ورقمك يُسحبان من
          حسابك عند تسجيل الدخول لضمان صحة التواصل، ولا تظهر للعلن.
        </p>
      </div>
      <Card className="p-6">
        <RequestHelpFormWrapper />
      </Card>
    </div>
  );
}

async function RequestHelpFormWrapper() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/request-help");
  }

  const { data } = await supabase
    .from("profiles")
    .select("name,phone,is_anonymous")
    .eq("id", user.id)
    .single();

  const name = typeof data?.name === "string" ? data.name : "";
  const phone = typeof data?.phone === "string" ? data.phone : "";
  const isAnonymous = data?.is_anonymous === true;

  return <RequestHelpForm profile={{ name, phone, isAnonymous }} />;
}
