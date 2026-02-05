import { describe, expect, it } from "vitest";
import { requestHelpSchema } from "@/lib/validation/request-help";

describe("requestHelpSchema", () => {
  it("accepts valid input", () => {
    const parsed = requestHelpSchema.safeParse({
      request_type: "food",
      request_detail: "food_box",
      request_detail_label: "سلة غذائية كاملة",
      governorate: "القاهرة",
      address_detail: "شارع النصر، بجوار مسجد، الدور الثاني",
      location_source: "manual",
      description: "أحتاج مساعدة غذائية لعائلتي بسبب ظروف صعبة وتشمل سلة غذائية كاملة.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects short description", () => {
    const parsed = requestHelpSchema.safeParse({
      request_type: "food",
      request_detail: "grocery_basic",
      governorate: "القاهرة",
      address_detail: "شارع النصر، بجوار مسجد، الدور الثاني",
      location_source: "manual",
      description: "قصير",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts gps payload when lat/lng are present", () => {
    const parsed = requestHelpSchema.safeParse({
      request_type: "medical",
      request_detail: "medicine",
      governorate: "الجيزة",
      address_detail: "الهرم، شارع 9، بجوار ...",
      location_source: "gps",
      location_lat: 30.013,
      location_lng: 31.208,
      location_accuracy_m: 35,
      description: "أحتاج دواء بشكل عاجل مع روشتة من الطبيب ومرفقات داعمة.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects gps payload when lat/lng are missing", () => {
    const parsed = requestHelpSchema.safeParse({
      request_type: "housing",
      request_detail: "blankets",
      governorate: "القاهرة",
      address_detail: "مدينة نصر، ...",
      location_source: "gps",
      description: "أحتاج بطاطين لعائلة بسبب برد شديد وظروف صعبة.",
    });
    expect(parsed.success).toBe(false);
  });
});
