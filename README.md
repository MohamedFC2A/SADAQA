# SADAQA
منصة التبرعات + طلبات المساعدة (MVP: Request Help + Admin).

## المتطلبات
- Node.js + npm
- مشروع Supabase (Postgres + Auth + Storage)

## إعداد Supabase (مرة واحدة)
1) أنشئ Project في Supabase وفَعِّل Email/Password.
2) نفّذ ملف `supabase/schema.sql` داخل Supabase SQL Editor.
3) أنشئ Bucket باسم `request-images` واجعله **Private**.
4) أنشئ حساب أدمن عبر Auth، ثم أضف/حدّث صفّه في `profiles` ليكون `role='admin'`.

## متغيرات البيئة
انسخ `.env.example` إلى `.env.local` واملأ القيم:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## التشغيل
```bash
npm run dev
```

## المسارات المهمة
- `/request-help` نموذج طلب المساعدة
- `/admin/requests` لوحة الأدمن (تتطلب تسجيل دخول + role=admin)

## الاختبارات
```bash
npm test
```
