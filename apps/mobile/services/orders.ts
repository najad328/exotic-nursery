import { supabase } from "./supabase";
import type { DeliveryDetails, Order, OrderWithItems, PaymentMethod } from "@exotic-nursery/types";

export async function placeOrder(
  delivery: DeliveryDetails,
  paymentMethod: PaymentMethod = "cod"
): Promise<string> {
  const { data, error } = await supabase.rpc("place_order", {
    p_payment_method: paymentMethod,
    p_delivery_name: delivery.delivery_name,
    p_delivery_phone: delivery.delivery_phone,
    p_delivery_address: delivery.delivery_address,
    p_delivery_city: delivery.delivery_city,
    p_delivery_pincode: delivery.delivery_pincode,
    p_notes: delivery.notes ?? null,
    p_delivery_fee_paise: 0, // Free delivery for MVP
  });

  if (error) throw error;
  return data as string;
}

export async function getOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Order[];
}

export async function getOrderById(orderId: string): Promise<OrderWithItems> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*)
    `)
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return data as unknown as OrderWithItems;
}
