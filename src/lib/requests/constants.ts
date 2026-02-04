export const requestTypes = [
  "money",
  "food",
  "clothes",
  "medical",
  "education",
  "housing",
] as const;

export type RequestType = (typeof requestTypes)[number];

export const urgencyLevels = ["low", "medium", "high", "urgent"] as const;

export type UrgencyLevel = (typeof urgencyLevels)[number];

export const requestStatuses = [
  "pending",
  "approved",
  "rejected",
  "completed",
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

export const requestTypeLabelAr: Record<RequestType, string> = {
  money: "مالي",
  food: "غذائي",
  clothes: "ملابس",
  medical: "علاج",
  education: "تعليم",
  housing: "سكن",
};

export const urgencyLabelAr: Record<UrgencyLevel, string> = {
  low: "منخفض",
  medium: "متوسط",
  high: "عالي",
  urgent: "عاجل",
};

export const statusLabelAr: Record<RequestStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  completed: "مكتمل",
};

