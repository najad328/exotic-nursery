"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@exotic-nursery/utils";
import { createSupabaseBrowserClient } from "../../../../lib/supabase-browser";

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  processing: "Being Prepared",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  out_for_delivery: "bg-orange-100 text-orange-800 border-orange-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

interface OrderData {
  id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal_paise: number;
  delivery_fee_paise: number;
  total_paise: number;
  delivery_name: string;
  delivery_phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_pincode: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    id: string;
    plant_name: string;
    plant_image: string | null;
    quantity: number;
    price_paise: number;
  }>;
  profiles: {
    full_name: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    pincode: string | null;
  } | null;
}

export function OrderDetailClient({ order: initialOrder }: { order: OrderData }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [newStatus, setNewStatus] = useState(order.status);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  const currentIndex = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number]);
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";

  // Only allow forward transitions
  const availableStatuses = isCancelled || isDelivered
    ? []
    : STATUS_FLOW.slice(currentIndex + 1);

  async function handleStatusUpdate() {
    if (newStatus === order.status) return;
    setUpdating(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", order.id);

      if (error) throw error;

      setOrder((prev) => ({ ...prev, status: newStatus }));
      setMessage("Status updated successfully!");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status";
      setMessage(`Error: ${msg}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setUpdating(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      if (error) throw error;

      setOrder((prev) => ({ ...prev, status: "cancelled" }));
      setNewStatus("cancelled");
      setMessage("Order cancelled.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to cancel";
      setMessage(`Error: ${msg}`);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-sm font-medium border capitalize ${
            STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      {message && (
        <div
          className={`px-4 py-3 rounded-lg text-sm ${
            message.startsWith("Error")
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-green-50 border border-green-200 text-green-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Status Update */}
      {!isCancelled && !isDelivered && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Update Status</h3>
          <div className="flex items-center gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="input-field w-auto"
            >
              <option value={order.status} disabled>
                Current: {STATUS_LABELS[order.status]}
              </option>
              {availableStatuses.map((s) => (
                <option key={s} value={s}>
                  → {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === order.status}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {updating ? "Updating..." : "Update Status"}
            </button>
            <button
              onClick={handleCancel}
              disabled={updating}
              className="ml-auto bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            >
              Cancel Order
            </button>
          </div>

          {/* Status Timeline */}
          <div className="mt-6 flex items-center gap-1">
            {STATUS_FLOW.map((status, idx) => {
              const isCompleted = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={status} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      } ${isCurrent ? "ring-2 ring-green-300" : ""}`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">
                      {STATUS_LABELS[status]}
                    </span>
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        idx < currentIndex ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Order Items</h3>
        <div className="space-y-3">
          {order.order_items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0"
            >
              {item.plant_image ? (
                <img
                  src={item.plant_image}
                  alt={item.plant_name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-xl">
                  🌱
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800">{item.plant_name}</p>
                <p className="text-sm text-gray-500">
                  {formatPrice(item.price_paise)} × {item.quantity}
                </p>
              </div>
              <p className="font-mono font-medium text-gray-800">
                {formatPrice(item.price_paise * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{formatPrice(order.subtotal_paise)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery</span>
            <span className="text-green-600 font-medium">FREE</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-green-700">{formatPrice(order.total_paise)}</span>
          </div>
        </div>
      </div>

      {/* Customer & Delivery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Customer</h3>
          <p className="text-gray-800 font-medium">
            {order.profiles?.full_name ?? order.delivery_name}
          </p>
          <p className="text-gray-500 text-sm mt-1">
            {order.profiles?.phone ?? order.delivery_phone}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Delivery Address</h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {order.delivery_name}
            <br />
            {order.delivery_address}
            <br />
            {order.delivery_city} — {order.delivery_pincode}
            <br />
            📞 {order.delivery_phone}
          </p>
          {order.notes && (
            <p className="text-gray-500 text-sm mt-3 italic">
              Note: {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">Payment</h3>
        <div className="flex gap-8 text-sm">
          <div>
            <span className="text-gray-500">Method:</span>{" "}
            <span className="font-medium uppercase">{order.payment_method}</span>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>{" "}
            <span className="font-medium capitalize">{order.payment_status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
