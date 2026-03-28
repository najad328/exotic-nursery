import { createSupabaseServerClient } from "../../../../lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { OrderDetailClient } from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (*),
      profiles:user_id (full_name, phone, address, city, pincode)
    `)
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  return (
    <div className="p-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/orders" className="hover:text-green-700">
          Orders
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <OrderDetailClient order={{
        ...order,
        tracking_number: (order as Record<string, unknown>).tracking_number as string | null ?? null,
        courier_name: (order as Record<string, unknown>).courier_name as string | null ?? null,
        courier_tracking_url: (order as Record<string, unknown>).courier_tracking_url as string | null ?? null,
        estimated_delivery_at: (order as Record<string, unknown>).estimated_delivery_at as string | null ?? null,
        shipped_at: (order as Record<string, unknown>).shipped_at as string | null ?? null,
        delivered_at: (order as Record<string, unknown>).delivered_at as string | null ?? null,
        shiprocket_order_id: (order as Record<string, unknown>).shiprocket_order_id as string | null ?? null,
        shiprocket_shipment_id: (order as Record<string, unknown>).shiprocket_shipment_id as string | null ?? null,
        awb_code: (order as Record<string, unknown>).awb_code as string | null ?? null,
      }} />
    </div>
  );
}
