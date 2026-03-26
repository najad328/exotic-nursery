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

      <OrderDetailClient order={order} />
    </div>
  );
}
