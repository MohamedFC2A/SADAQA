import { Card } from "@/components/ui/card";
import { LoginForm } from "@/app/(site)/login/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const next = searchParams?.next;

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-3xl font-semibold">تسجيل الدخول</h1>
      <Card className="p-6">
        <LoginForm nextPath={next} />
      </Card>
    </div>
  );
}

