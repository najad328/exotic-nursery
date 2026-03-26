import { z } from "zod";

// ─── Plant Validation Schemas ───────────────────────────────────────

export const careLevelSchema = z.enum(["easy", "medium", "hard", "expert"]);
export const sunlightSchema = z.enum(["full_sun", "partial", "indirect", "low_light"]);
export const wateringSchema = z.enum(["daily", "moderate", "weekly", "minimal"]);

/** Schema for creating a new plant (admin form) */
export const createPlantSchema = z.object({
  name: z
    .string()
    .min(2, "Plant name must be at least 2 characters")
    .max(100, "Plant name must be under 100 characters")
    .trim(),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(120, "Slug must be under 120 characters")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters")
    .trim(),
  category_id: z.string().uuid("Invalid category"),
  price_paise: z
    .number()
    .int("Price must be a whole number (in paise)")
    .min(100, "Price must be at least ₹1.00")
    .max(10000000, "Price must be under ₹1,00,000"),
  stock_quantity: z
    .number()
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative")
    .max(99999, "Stock seems unrealistically high"),
  image_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .max(10, "Maximum 10 images")
    .optional()
    .default([]),
  care_level: careLevelSchema,
  sunlight: sunlightSchema,
  watering: wateringSchema,
  care_tips: z
    .string()
    .max(2000, "Care tips must be under 2000 characters")
    .optional()
    .default(""),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
});

/** Schema for updating an existing plant (all fields optional except id) */
export const updatePlantSchema = createPlantSchema.partial().extend({
  id: z.string().uuid("Invalid plant ID"),
});

/** Type inferred from the create schema */
export type CreatePlantInput = z.infer<typeof createPlantSchema>;

/** Type inferred from the update schema */
export type UpdatePlantInput = z.infer<typeof updatePlantSchema>;

// ─── CSV/Bulk Upload Schema ─────────────────────────────────────────

/** Schema for a single row in a CSV/JSON bulk upload */
export const bulkPlantRowSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().min(10).max(2000).trim(),
  category_name: z.string().min(1, "Category name is required").trim(),
  price_rupees: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .pipe(z.number().min(1, "Price must be at least ₹1").max(100000, "Price must be under ₹1,00,000")),
  stock_quantity: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
    .pipe(z.number().int().min(0).max(99999)),
  care_level: careLevelSchema.optional().default("medium"),
  sunlight: sunlightSchema.optional().default("indirect"),
  watering: wateringSchema.optional().default("moderate"),
  care_tips: z.string().max(2000).optional().default(""),
  is_featured: z
    .union([z.string(), z.boolean()])
    .transform((val) => {
      if (typeof val === "string") {
        return val.toLowerCase() === "true" || val === "1" || val.toLowerCase() === "yes";
      }
      return val;
    })
    .optional()
    .default(false),
});

export type BulkPlantRow = z.infer<typeof bulkPlantRowSchema>;

/** Validate an entire bulk upload array */
export function validateBulkUpload(rows: unknown[]): {
  valid: BulkPlantRow[];
  errors: Array<{ row: number; errors: string[] }>;
} {
  const valid: BulkPlantRow[] = [];
  const errors: Array<{ row: number; errors: string[] }> = [];

  for (let i = 0; i < rows.length; i++) {
    const result = bulkPlantRowSchema.safeParse(rows[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        row: i + 1,
        errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
      });
    }
  }

  return { valid, errors };
}

// ─── Category Schema ────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(2).max(50).trim(),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).trim(),
  description: z.string().max(500).optional().default(""),
  image_url: z.string().url().optional().or(z.literal("")),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

// ─── Slug Generator ─────────────────────────────────────────────────

/** Generate a URL-friendly slug from a plant name */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
