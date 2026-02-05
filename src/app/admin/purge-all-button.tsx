"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type State = "idle" | "purging" | "done" | "error";

export function PurgeAllButton({
  endpoint,
  label,
  warning,
}: {
  endpoint: string;
  label: string;
  warning?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>("idle");

  async function purge() {
    if (state === "purging") return;
    const ok = window.confirm(
      `تحذير: سيتم حذف ${label} نهائياً. هذا الإجراء لا يمكن التراجع عنه.`,
    );
    if (!ok) return;

    const typed = window.prompt('اكتب DELETE للتأكيد');
    if (typed !== "DELETE") return;

    setState("purging");
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) {
        setState("error");
        return;
      }
      setState("done");
      router.refresh();
      setTimeout(() => setState("idle"), 1400);
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      {warning ? (
        <div className="hidden text-xs text-muted-foreground lg:block">
          {warning}
        </div>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        onClick={purge}
        className="border-pal-red/30 text-pal-red hover:bg-pal-red/10"
        disabled={state === "purging"}
      >
        {state === "purging"
          ? "جارٍ الحذف..."
          : state === "done"
            ? "تم الحذف"
            : "حذف الكل"}
      </Button>
    </div>
  );
}
