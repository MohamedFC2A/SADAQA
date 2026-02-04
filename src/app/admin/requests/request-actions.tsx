"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function RequestActions({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    const ok = window.confirm("هل تريد حذف الطلب نهائياً؟");
    if (!ok) return;
    const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("تعذر حذف الطلب.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/admin/requests/${id}`}
        className="text-sm font-semibold text-pal-green hover:underline"
      >
        فتح
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

