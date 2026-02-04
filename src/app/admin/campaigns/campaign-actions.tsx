"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function CampaignActions({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    const ok = window.confirm("هل تريد حذف الحملة نهائياً؟");
    if (!ok) return;
    const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("تعذر حذف الحملة.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/admin/campaigns/${id}`}
        className="text-sm font-semibold text-pal-green hover:underline"
      >
        تعديل
      </Link>
      <button
        type="button"
        onClick={remove}
        className="text-sm font-semibold text-pal-red hover:underline"
      >
        حذف
      </button>
    </div>
  );
}

