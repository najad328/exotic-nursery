import { create } from "zustand";
import type { CartItemWithPlant } from "@exotic-nursery/types";
import * as cartService from "../services/cart";

interface CartStore {
  items: CartItemWithPlant[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchCart: () => Promise<void>;
  addItem: (plantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  // Computed-like helpers
  totalItems: () => number;
  subtotalPaise: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchCart: async () => {
    set({ loading: true, error: null });
    try {
      const items = await cartService.getCartItems();
      set({ items, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load cart";
      set({ error: message, loading: false });
    }
  },

  addItem: async (plantId: string, quantity = 1) => {
    set({ error: null });
    try {
      await cartService.addToCart(plantId, quantity);
      await get().fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add item";
      set({ error: message });
      throw err;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    set({ error: null });
    try {
      await cartService.updateCartQuantity(cartItemId, quantity);
      await get().fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update quantity";
      set({ error: message });
    }
  },

  removeItem: async (cartItemId: string) => {
    set({ error: null });
    try {
      await cartService.removeFromCart(cartItemId);
      await get().fetchCart();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove item";
      set({ error: message });
    }
  },

  clearCart: async () => {
    set({ error: null });
    try {
      await cartService.clearCart();
      set({ items: [] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to clear cart";
      set({ error: message });
    }
  },

  totalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  subtotalPaise: () => {
    return get().items.reduce(
      (sum, item) => sum + item.plant.price_paise * item.quantity,
      0
    );
  },
}));
