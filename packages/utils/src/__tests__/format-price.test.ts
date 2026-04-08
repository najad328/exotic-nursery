import { describe, it, expect } from "vitest";
import { formatPrice, toPaise } from "../index";

describe("formatPrice", () => {
  it("converts paise to INR display string", () => {
    expect(formatPrice(15000)).toBe("₹150.00");
  });

  it("handles zero", () => {
    expect(formatPrice(0)).toBe("₹0.00");
  });

  it("handles small amounts", () => {
    expect(formatPrice(1)).toBe("₹0.01");
    expect(formatPrice(50)).toBe("₹0.50");
    expect(formatPrice(99)).toBe("₹0.99");
  });

  it("handles large amounts", () => {
    expect(formatPrice(10000000)).toBe("₹100000.00");
  });

  it("rounds to 2 decimal places", () => {
    expect(formatPrice(1)).toBe("₹0.01");
    expect(formatPrice(333)).toBe("₹3.33");
  });
});

describe("toPaise", () => {
  it("converts rupees to paise", () => {
    expect(toPaise(150)).toBe(15000);
  });

  it("handles zero", () => {
    expect(toPaise(0)).toBe(0);
  });

  it("handles decimal rupees", () => {
    expect(toPaise(1.5)).toBe(150);
    expect(toPaise(99.99)).toBe(9999);
  });

  it("rounds to avoid floating-point errors", () => {
    // 19.99 * 100 = 1998.9999... without Math.round
    expect(toPaise(19.99)).toBe(1999);
  });

  it("handles large amounts", () => {
    expect(toPaise(100000)).toBe(10000000);
  });
});
