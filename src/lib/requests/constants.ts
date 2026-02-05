export const requestTypes = ["medical", "food", "housing"] as const;

export type RequestType = (typeof requestTypes)[number];

export const requestStatuses = [
  "pending",
  "approved",
  "rejected",
  "completed",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const requestTypeLabelAr: Record<RequestType, string> = {
  medical: "علاجي",
  food: "غذائي",
  housing: "سكني",
};

export const requestNeedDetails: Record<
  RequestType,
  ReadonlyArray<{ value: string; label: string }>
> = {
  food: [
    { value: "grocery_basic", label: "مواد غذائية (أرز/سكر/زيت)" },
    { value: "food_box", label: "سلة غذائية كاملة" },
    { value: "ready_meals", label: "وجبات جاهزة / مطبوخة" },
  ],
  housing: [
    { value: "blankets", label: "بطاطين / تدفئة" },
    { value: "rent", label: "مساعدة إيجار" },
    { value: "repair", label: "ترميم بسيط / صيانة منزلية" },
    { value: "furniture", label: "أثاث أساسي (سرير/مرتبة)" },
  ],
  medical: [
    { value: "consult", label: "كشف / استشارة طبية" },
    { value: "medicine", label: "دواء / روشتة" },
    { value: "procedure", label: "عملية / إجراء طبي" },
    { value: "tests", label: "تحاليل / أشعة" },
  ],
} as const;

export const statusLabelAr: Record<RequestStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  completed: "مكتمل",
};
