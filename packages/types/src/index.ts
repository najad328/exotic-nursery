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

// ---- Cart ----

export interface CartItem {
  id: string;
  user_id: string;
  plant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CartItemWithPlant extends CartItem {
  plant: Pick<Plant, "id" | "name" | "slug" | "price_paise" | "stock_quantity" | "image_url" | "is_active">;
}

// ---- Orders ----

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "upi";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_pincode: string;
  notes: string | null;
  // Courier tracking fields
  tracking_number: string | null;
  courier_name: string | null;
  courier_tracking_url: string | null;
  estimated_delivery_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  awb_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  plant_id: string;
  plant_name: string;
  plant_image: string | null;
  quantity: number;
  price_paise: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

// ---- Shipment Events ----

export interface ShipmentEvent {
  id: string;
  order_id: string;
  status: string;
  location: string | null;
  description: string;
  event_time: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface DeliveryDetails {
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_pincode: string;
  notes?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Being Prepared",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
];

// Phase 5: WhatsApp template types will go here
// Phase 6: Chat types will go here
