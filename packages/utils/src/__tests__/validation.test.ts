import { describe, it, expect } from "vitest";
import {
  createPlantSchema,
  bulkPlantRowSchema,
  validateBulkUpload,
  generateSlug,
  createCategorySchema,
} from "../validation";

// ---------- generateSlug ----------

describe("generateSlug", () => {
  it("converts name to lowercase hyphenated slug", () => {
    expect(generateSlug("Monstera Deliciosa")).toBe("monstera-deliciosa");
  });

  it("removes special characters", () => {
    expect(generateSlug("Bird's Nest Fern")).toBe("birds-nest-fern");
  });

  it("collapses multiple spaces/hyphens", () => {
    expect(generateSlug("Peace   Lily")).toBe("peace-lily");
    expect(generateSlug("peace---lily")).toBe("peace-lily");
  });

  it("trims leading/trailing whitespace and hyphens", () => {
    expect(generateSlug("  Aloe Vera  ")).toBe("aloe-vera");
  });

  it("handles single word", () => {
    expect(generateSlug("Cactus")).toBe("cactus");
  });

  it("handles empty string", () => {
    expect(generateSlug("")).toBe("");
  });
});

// ---------- createPlantSchema ----------

describe("createPlantSchema", () => {
  const validPlant = {
    name: "Monstera Deliciosa",
    slug: "monstera-deliciosa",
    description: "A beautiful tropical plant with split leaves.",
    category_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    price_paise: 50000,
    stock_quantity: 10,
    care_level: "medium" as const,
    sunlight: "indirect" as const,
    watering: "moderate" as const,
  };

  it("validates a correct plant", () => {
    const result = createPlantSchema.safeParse(validPlant);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = createPlantSchema.safeParse({ ...validPlant, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid slug format", () => {
    const result = createPlantSchema.safeParse({
      ...validPlant,
      slug: "Invalid Slug!",
    });
    expect(result.success).toBe(false);
  });

  it("rejects price below minimum (100 paise = ₹1)", () => {
    const result = createPlantSchema.safeParse({
      ...validPlant,
      price_paise: 50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative stock", () => {
    const result = createPlantSchema.safeParse({
      ...validPlant,
      stock_quantity: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category_id (not UUID)", () => {
    const result = createPlantSchema.safeParse({
      ...validPlant,
      category_id: "not-a-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional fields with defaults", () => {
    const result = createPlantSchema.safeParse(validPlant);
    if (result.success) {
      expect(result.data.is_active).toBe(true);
      expect(result.data.is_featured).toBe(false);
      expect(result.data.care_tips).toBe("");
      expect(result.data.images).toEqual([]);
    }
  });

  it("rejects invalid care_level enum value", () => {
    const result = createPlantSchema.safeParse({
      ...validPlant,
      care_level: "impossible",
    });
    expect(result.success).toBe(false);
  });
});

// ---------- bulkPlantRowSchema ----------

describe("bulkPlantRowSchema", () => {
  const validRow = {
    name: "Snake Plant",
    description: "A resilient plant perfect for beginners.",
    category_name: "Indoor Plants",
    price_rupees: 250,
    stock_quantity: 20,
  };

  it("validates a correct row", () => {
    const result = bulkPlantRowSchema.safeParse(validRow);
    expect(result.success).toBe(true);
  });

  it("transforms string price to number", () => {
    const result = bulkPlantRowSchema.safeParse({
      ...validRow,
      price_rupees: "250",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price_rupees).toBe(250);
    }
  });

  it("transforms string stock to integer", () => {
    const result = bulkPlantRowSchema.safeParse({
      ...validRow,
      stock_quantity: "20",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stock_quantity).toBe(20);
    }
  });

  it("transforms string is_featured to boolean", () => {
    for (const truthy of ["true", "TRUE", "1", "yes"]) {
      const result = bulkPlantRowSchema.safeParse({
        ...validRow,
        is_featured: truthy,
      });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.is_featured).toBe(true);
    }

    const result = bulkPlantRowSchema.safeParse({
      ...validRow,
      is_featured: "false",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.is_featured).toBe(false);
  });

  it("applies defaults for optional fields", () => {
    const result = bulkPlantRowSchema.safeParse(validRow);
    if (result.success) {
      expect(result.data.care_level).toBe("medium");
      expect(result.data.sunlight).toBe("indirect");
      expect(result.data.watering).toBe("moderate");
      expect(result.data.is_featured).toBe(false);
    }
  });
});

// ---------- validateBulkUpload ----------

describe("validateBulkUpload", () => {
  it("returns valid rows and empty errors for good data", () => {
    const rows = [
      {
        name: "Plant A",
        description: "Description for Plant A here.",
        category_name: "Indoor",
        price_rupees: 100,
        stock_quantity: 5,
      },
      {
        name: "Plant B",
        description: "Description for Plant B here.",
        category_name: "Outdoor",
        price_rupees: 200,
        stock_quantity: 10,
      },
    ];
    const { valid, errors } = validateBulkUpload(rows);
    expect(valid).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });

  it("separates invalid rows with error details", () => {
    const rows = [
      {
        name: "A", // too short
        description: "Short", // too short
        category_name: "",
        price_rupees: 0,
        stock_quantity: -1,
      },
    ];
    const { valid, errors } = validateBulkUpload(rows);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.row).toBe(1);
    expect(errors[0]!.errors.length).toBeGreaterThan(0);
  });

  it("handles mixed valid and invalid rows", () => {
    const rows = [
      {
        name: "Good Plant",
        description: "A perfectly valid plant description.",
        category_name: "Indoor",
        price_rupees: 100,
        stock_quantity: 5,
      },
      {
        name: "X",
        description: "Bad",
        category_name: "",
        price_rupees: 0,
        stock_quantity: -1,
      },
    ];
    const { valid, errors } = validateBulkUpload(rows);
    expect(valid).toHaveLength(1);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.row).toBe(2);
  });

  it("handles empty array", () => {
    const { valid, errors } = validateBulkUpload([]);
    expect(valid).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});

// ---------- createCategorySchema ----------

describe("createCategorySchema", () => {
  it("validates a correct category", () => {
    const result = createCategorySchema.safeParse({
      name: "Indoor Plants",
      slug: "indoor-plants",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug", () => {
    const result = createCategorySchema.safeParse({
      name: "Indoor Plants",
      slug: "Indoor Plants!",
    });
    expect(result.success).toBe(false);
  });
});
