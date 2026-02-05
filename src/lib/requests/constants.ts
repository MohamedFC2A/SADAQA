export const requestTypes = ["medical", "food", "housing"] as const;

export type RequestType = (typeof requestTypes)[number];

export type UrgencyLevel = "urgent";

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

export const urgencyLabelAr: Record<UrgencyLevel, string> = {
  urgent: "عاجل",
};

export const statusLabelAr: Record<RequestStatus, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
  completed: "مكتمل",
};
