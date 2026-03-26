import { supabase } from "./supabase";
import type { CartItemWithPlant } from "@exotic-nursery/types";

export async function getCartItems(): Promise<CartItemWithPlant[]> {
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      id, user_id, plant_id, quantity, created_at, updated_at,
      plants:plant_id (id, name, slug, price_paise, stock_quantity, image_url, is_active)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => ({
    id: item.id,
    user_id: item.user_id,
    plant_id: item.plant_id,
    quantity: item.quantity,
    created_at: item.created_at,
    updated_at: item.updated_at,
    plant: item.plants as unknown as CartItemWithPlant["plant"],
  }));
}

export async function addToCart(plantId: string, quantity: number = 1) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Upsert — if already in cart, increment quantity
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("plant_id", plantId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("cart_items")
      .insert({ user_id: user.id, plant_id: plantId, quantity });
    if (error) throw error;
  }
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  if (quantity <= 0) {
    return removeFromCart(cartItemId);
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) throw error;
}

export async function removeFromCart(cartItemId: string) {
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", cartItemId);

  if (error) throw error;
}

export async function clearCart() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id);

  if (error) throw error;
}
