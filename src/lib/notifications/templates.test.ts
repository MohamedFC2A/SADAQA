import { describe, expect, it } from "vitest";
import { donationStatusNotification, requestStatusNotification } from "@/lib/notifications/templates";

describe("notification templates", () => {
  it("builds donation verified notification", () => {
    const payload = donationStatusNotification({
      nextStatus: "verified",
      paymentCode: "123456",
      amount: 100,
      currency: "EGP",
    });
    expect(payload).not.toBeNull();
    expect(payload?.title).toContain("تم التحقق");
    expect(payload?.body).toContain("123456");
    expect(payload?.linkUrl).toBe("/profile");
  });

  it("returns null for donation pending", () => {
    const payload = donationStatusNotification({ nextStatus: "pending" });
    expect(payload).toBeNull();
  });

  it("builds request approved notification", () => {
    const payload = requestStatusNotification({
      nextStatus: "approved",
      requesterName: "أحمد",
      requestTypeLabel: "غذائي",
    });
    expect(payload).not.toBeNull();
    expect(payload?.title).toContain("الموافقة");
    expect(payload?.body).toContain("أحمد");
    expect(payload?.body).toContain("غذائي");
    expect(payload?.linkUrl).toBe("/profile");
  });
});

