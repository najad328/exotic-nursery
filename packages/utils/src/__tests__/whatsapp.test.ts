import { describe, it, expect } from "vitest";
import {
  buildWhatsAppUrl,
  interpolateTemplate,
  buildWhatsAppFromTemplate,
  buildOrderStatusWhatsAppUrl,
  buildPlantInquiryWhatsAppUrl,
} from "../whatsapp";

describe("buildWhatsAppUrl", () => {
  it("builds URL with Indian country code", () => {
    const url = buildWhatsAppUrl("9876543210", "Hello");
    expect(url).toBe("https://wa.me/919876543210?text=Hello");
  });

  it("does not double-add 91 prefix", () => {
    const url = buildWhatsAppUrl("919876543210", "Hi");
    expect(url).toBe("https://wa.me/919876543210?text=Hi");
  });

  it("strips + from international format", () => {
    const url = buildWhatsAppUrl("+919876543210", "Hi");
    expect(url).toBe("https://wa.me/919876543210?text=Hi");
  });

  it("cleans spaces and dashes from phone", () => {
    const url = buildWhatsAppUrl("98765 432-10", "Hi");
    expect(url).toBe("https://wa.me/919876543210?text=Hi");
  });

  it("encodes message for URL", () => {
    const url = buildWhatsAppUrl("9876543210", "Hello World!");
    expect(url).toContain("text=Hello%20World!");
  });
});

describe("interpolateTemplate", () => {
  it("replaces single variable", () => {
    expect(interpolateTemplate("Hi {{name}}!", { name: "Raj" })).toBe(
      "Hi Raj!"
    );
  });

  it("replaces multiple variables", () => {
    const result = interpolateTemplate(
      "Order #{{order_id}} for {{customer}}",
      { order_id: "ABC123", customer: "Raj" }
    );
    expect(result).toBe("Order #ABC123 for Raj");
  });

  it("leaves unmatched variables as-is", () => {
    expect(interpolateTemplate("Hi {{name}}!", {})).toBe("Hi {{name}}!");
  });

  it("handles template with no variables", () => {
    expect(interpolateTemplate("Hello!", { name: "Raj" })).toBe("Hello!");
  });
});

describe("buildWhatsAppFromTemplate", () => {
  it("combines template interpolation with URL building", () => {
    const url = buildWhatsAppFromTemplate(
      "9876543210",
      "Hi {{name}}, your order is ready!",
      { name: "Raj" }
    );
    expect(url).toContain("wa.me/919876543210");
    expect(url).toContain("Hi%20Raj");
  });
});

describe("buildOrderStatusWhatsAppUrl", () => {
  it("generates pending order message", () => {
    const url = buildOrderStatusWhatsAppUrl(
      "9876543210",
      "Raj",
      "abcd1234-5678-9012-3456-789012345678",
      "pending",
      "₹500.00"
    );
    expect(url).toContain("ABCD1234");
    expect(url).toContain("placed");
    expect(url).toContain("500.00");
  });

  it("generates delivered order message", () => {
    const url = buildOrderStatusWhatsAppUrl(
      "9876543210",
      "Raj",
      "abcd1234-5678-9012-3456-789012345678",
      "delivered"
    );
    expect(url).toContain("delivered");
    expect(url).toContain("Enjoy");
  });

  it("handles unknown status gracefully", () => {
    const url = buildOrderStatusWhatsAppUrl(
      "9876543210",
      "Raj",
      "abcd1234-5678-9012-3456-789012345678",
      "unknown_status"
    );
    expect(url).toContain("unknown_status");
  });
});

describe("buildPlantInquiryWhatsAppUrl", () => {
  it("includes plant name in message", () => {
    const url = buildPlantInquiryWhatsAppUrl("9876543210", "Monstera Deliciosa");
    expect(url).toContain("Monstera%20Deliciosa");
    expect(url).toContain("wa.me/919876543210");
  });
});
