import { describe, expect, it } from "vitest";
import { generatePaymentCode } from "@/lib/donations/payment-code";

describe("generatePaymentCode", () => {
  it("returns 6 digits and allows leading zeros", () => {
    const code = generatePaymentCode(() => 42);
    expect(code).toBe("000042");
    expect(code).toMatch(/^\d{6}$/);
  });

  it("never returns 000000", () => {
    const code = generatePaymentCode(() => 0);
    expect(code).not.toBe("000000");
    expect(code).toMatch(/^\d{6}$/);
  });
});

