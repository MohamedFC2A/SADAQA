import { randomInt as cryptoRandomInt } from "crypto";

type RandomInt = (min: number, max: number) => number;

export function generatePaymentCode(randomInt: RandomInt = cryptoRandomInt) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const n = randomInt(0, 1_000_000);
    const code = String(n).padStart(6, "0");
    if (code !== "000000") return code;
  }
  return "000001";
}

