import { Card } from "@/components/ui/card";
import { SignupForm } from "@/app/(site)/signup/signup-form";

export default function SignupPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">إنشاء حساب</h1>
        <p className="text-muted-foreground">
          أنشئ حسابك الآن. الاسم ورقم الهاتف مطلوبان لضمان التواصل الصحيح مع الإدارة.
        </p>
      </div>
      <Card className="p-6">
        <SignupForm nextPath={next} />
      </Card>
    </div>
  );
}

