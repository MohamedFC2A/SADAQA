import { describe, expect, it } from "vitest";
import { requestHelpSchema } from "@/lib/validation/request-help";

describe("requestHelpSchema", () => {
  it("accepts valid input", () => {
    const parsed = requestHelpSchema.safeParse({
      requester_name: "أحمد محمد",
      phone: "0599999999",
      location: "القاهرة - العنوان التفصيلي",
      request_type: "food",
      description: "أحتاج مساعدة غذائية لعائلتي بسبب ظروف صعبة وتشمل سلة غذائية كاملة.",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects short description", () => {
    const parsed = requestHelpSchema.safeParse({
      requester_name: "أحمد",
      phone: "0599999999",
      location: "القاهرة - العنوان التفصيلي",
      request_type: "food",
      description: "قصير",
    });
    expect(parsed.success).toBe(false);
  });
});
