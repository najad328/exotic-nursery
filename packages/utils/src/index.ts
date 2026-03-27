// Shared utilities for the Exotic Nursery app
export * from "./validation";
export * from "./whatsapp";

/**
 * Format price from paise (integer) to display string.
 * We store prices in paise to avoid floating-point math errors.
 * @example formatPrice(15000) → "₹150.00"
 */
export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

/**
 * Convert rupees to paise for storage.
 * @example toPaise(150) → 15000
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
