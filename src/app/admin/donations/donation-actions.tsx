"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function DonationActions({ id }: { id: string }) {
  const router = useRouter();

  async function remove() {
    const ok = window.confirm("هل تريد حذف هذا التبرع نهائياً؟");
    if (!ok) return;
    const res = await fetch(`/api/admin/donations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("تعذر حذف التبرع.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/admin/donations/${id}`}
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

