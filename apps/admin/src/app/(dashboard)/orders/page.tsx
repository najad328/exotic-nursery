import { createSupabaseServerClient } from "../../../lib/supabase-server";
import Link from "next/link";
import { OrderListClient } from "./OrderListClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const supabase = await createSupabaseServerClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (id, plant_name, quantity, price_paise),
      profiles:user_id (full_name, phone)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">Failed to load orders: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
          <p className="text-gray-500 text-sm mt-1">
            {orders?.length ?? 0} total orders
          </p>
        </div>
      </div>

      <OrderListClient orders={orders ?? []} />
    </div>
  );
}
