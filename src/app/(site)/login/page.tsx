import { Card } from "@/components/ui/card";
import { LoginForm } from "@/app/(site)/login/login-form";
import Link from "next/link";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">تسجيل الدخول</h1>
        <p className="text-muted-foreground">
          سجّل الدخول لإدارة حسابك، متابعة التبرعات، وتقديم طلب مساعدة عند الحاجة.
        </p>
      </div>
      <Card className="p-6">
        <LoginForm nextPath={next} />
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        ليس لديك حساب؟{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-semibold text-pal-green hover:underline"
        >
          إنشاء حساب
        </Link>
      </div>
    </div>
  );
}
