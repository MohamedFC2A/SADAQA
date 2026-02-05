type DonationStatus = "pending" | "verified" | "canceled" | "proof_sent";
type RequestStatus = "pending" | "approved" | "rejected" | "completed";

export type NotificationPayload = {
  title: string;
  body: string;
  linkUrl?: string | null;
};

function money(amount: number | null | undefined, currency: string | null | undefined) {
  const a = typeof amount === "number" && Number.isFinite(amount) ? amount : null;
  const c = typeof currency === "string" && currency.trim() ? currency.trim() : "EGP";
  if (a === null) return null;
  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(a)} ${c}`;
}

export function donationStatusNotification(input: {
  nextStatus: DonationStatus;
  paymentCode?: string | null;
  amount?: number | null;
  currency?: string | null;
}): NotificationPayload | null {
  const code = input.paymentCode ? String(input.paymentCode) : null;
  const amountText = money(input.amount ?? null, input.currency ?? null);

  if (input.nextStatus === "verified") {
    return {
      title: "تم التحقق من تبرعك",
      body: [
        "جزاك الله خيراً. تم تأكيد تبرعك بنجاح.",
        code ? `كود الدفع: ${code}` : null,
        amountText ? `القيمة: ${amountText}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      linkUrl: "/profile",
    };
  }

  if (input.nextStatus === "proof_sent") {
    return {
      title: "تم استلام إثبات الدفع",
      body: [
        "تم استلام إثبات الدفع وسيتم مراجعته قريباً.",
        code ? `كود الدفع: ${code}` : null,
        amountText ? `القيمة: ${amountText}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      linkUrl: "/profile",
    };
  }

  if (input.nextStatus === "canceled") {
    return {
      title: "تم إلغاء التبرع",
      body: [
        "تم إلغاء التبرع. إذا كان هناك خطأ يمكنك التواصل مع الإدارة.",
        code ? `كود الدفع: ${code}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      linkUrl: "/profile",
    };
  }

  return null;
}

export function requestStatusNotification(input: {
  nextStatus: RequestStatus;
  requesterName?: string | null;
  requestTypeLabel?: string | null;
}): NotificationPayload | null {
  const name = typeof input.requesterName === "string" ? input.requesterName.trim() : "";
  const typeLabel =
    typeof input.requestTypeLabel === "string" ? input.requestTypeLabel.trim() : "";

  if (input.nextStatus === "approved") {
    return {
      title: "تمت الموافقة على طلبك",
      body: [
        "تمت الموافقة على طلب المساعدة الخاص بك. سنقوم بالتواصل معك في أقرب وقت.",
        name ? `الاسم: ${name}` : null,
        typeLabel ? `النوع: ${typeLabel}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      linkUrl: "/profile",
    };
  }

  if (input.nextStatus === "rejected") {
    return {
      title: "تم رفض طلبك",
      body: [
        "نأسف، تم رفض طلب المساعدة. يمكنك مراجعة تفاصيل الطلب أو التواصل مع الإدارة.",
        name ? `الاسم: ${name}` : null,
        typeLabel ? `النوع: ${typeLabel}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      linkUrl: "/profile",
    };
  }

  if (input.nextStatus === "completed") {
    return {
      title: "تم إكمال طلبك",
      body: [
        "تم إكمال طلب المساعدة. نسأل الله أن ييسر أمرك.",
        name ? `الاسم: ${name}` : null,
        typeLabel ? `النوع: ${typeLabel}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      linkUrl: "/profile",
    };
  }

  return null;
}

