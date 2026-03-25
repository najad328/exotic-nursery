// =============================================================
// Shared TypeScript interfaces for the Exotic Nursery app
// =============================================================
// App-level types derived from the database schema.
// For raw DB types, see @exotic-nursery/supabase/types/database.ts
// =============================================================

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// ---- Profiles ----

export type UserRole = "customer" | "admin";

export interface Profile extends BaseEntity {
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  address: string | null;
  city: string | null;
  pincode: string | null;
}

// ---- Categories ----

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

// ---- Plants ----

export type CareLevel = "easy" | "medium" | "hard" | "expert";
export type SunlightRequirement =
  | "full_sun"
  | "partial"
  | "indirect"
  | "low_light";
export type WateringFrequency = "daily" | "moderate" | "weekly" | "minimal";

export interface Plant extends BaseEntity {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price_paise: number;
  compare_at_price_paise: number | null;
  stock_quantity: number;
  image_url: string | null;
  images: string[];
  care_level: CareLevel;
  sunlight: SunlightRequirement;
  watering: WateringFrequency;
  growth_time: string | null;
  max_height: string | null;
  origin: string | null;
  care_tips: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

/** Plant with its category name joined */
export interface PlantWithCategory extends Plant {
  category: Pick<Category, "id" | "name" | "slug">;
}

// ---- Helpers ----

/** Convert paise to INR display string (e.g., 34900 → "₹349.00") */
export function formatPriceINR(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

/** Catalog query params */
export interface PlantFilters {
  search?: string;
  category_slug?: string;
  care_level?: CareLevel;
  min_price_paise?: number;
  max_price_paise?: number;
  is_featured?: boolean;
  sort_by?: "name" | "price_low" | "price_high" | "newest";
  page?: number;
  limit?: number;
}

// Phase 3: Order & Cart types will go here
// Phase 5: WhatsApp template types will go here
// Phase 6: Chat types will go here
