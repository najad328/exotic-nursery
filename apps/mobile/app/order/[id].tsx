import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getOrderById } from "../../services/orders";
import { supabase } from "../../services/supabase";
import { formatPrice } from "@exotic-nursery/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_FLOW } from "@exotic-nursery/types";
import type { OrderWithItems, OrderStatus } from "@exotic-nursery/types";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    loadOrder();

    // Subscribe to real-time order status changes
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updated = payload.new as { status: string; updated_at: string };
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: updated.status as OrderStatus,
              updated_at: updated.updated_at,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function loadOrder() {
    try {
      setLoading(true);
      const data = await getOrderById(id!);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || "Order not found"}</Text>
      </View>
    );
  }

  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status as OrderStatus);
  const isCancelled = order.status === "cancelled";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Success Banner (for new orders) */}
      {order.status === "pending" && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Order Placed Successfully!</Text>
          <Text style={styles.successSubtitle}>
            Your order has been received and is being processed.
          </Text>
        </View>
      )}

      {/* Order Info */}
      <View style={styles.section}>
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View
            style={[
              styles.statusBadge,
              isCancelled && styles.statusCancelled,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCancelled && styles.statusCancelledText,
              ]}
            >
              {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
            </Text>
          </View>
        </View>
        <InfoRow label="Order ID" value={order.id.slice(0, 8).toUpperCase()} />
        <InfoRow
          label="Date"
          value={new Date(order.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <InfoRow label="Payment" value={order.payment_method === "cod" ? "Cash on Delivery" : "UPI"} />
      </View>

      {/* Order Tracker */}
      {!isCancelled && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Tracker</Text>
          {ORDER_STATUS_FLOW.map((status, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={status} style={styles.trackerStep}>
                <View style={styles.trackerLine}>
                  <View
                    style={[
                      styles.trackerDot,
                      isCompleted && styles.trackerDotCompleted,
                      isCurrent && styles.trackerDotCurrent,
                    ]}
                  />
                  {index < ORDER_STATUS_FLOW.length - 1 && (
                    <View
                      style={[
                        styles.trackerConnector,
                        isCompleted && styles.trackerConnectorCompleted,
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.trackerLabel,
                    isCompleted && styles.trackerLabelCompleted,
                    isCurrent && styles.trackerLabelCurrent,
                  ]}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {order.order_items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.plant_name}</Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatPrice(item.price_paise * item.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>
            {formatPrice(order.subtotal_paise)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Delivery</Text>
          <Text style={styles.freeText}>FREE</Text>
        </View>
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandTotalLabel}>Total</Text>
          <Text style={styles.grandTotalValue}>
            {formatPrice(order.total_paise)}
          </Text>
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        <Text style={styles.addressText}>{order.delivery_name}</Text>
        <Text style={styles.addressText}>{order.delivery_phone}</Text>
        <Text style={styles.addressText}>{order.delivery_address}</Text>
        <Text style={styles.addressText}>
          {order.delivery_city} - {order.delivery_pincode}
        </Text>
        {order.notes && (
          <Text style={styles.notesText}>Note: {order.notes}</Text>
        )}
      </View>

      <Pressable
        style={styles.backButton}
        onPress={() => router.push("/(tabs)/orders")}
      >
        <Text style={styles.backButtonText}>View All Orders</Text>
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  scroll: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { color: "#C62828", fontSize: 15 },
  successBanner: {
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  successIcon: { fontSize: 40, marginBottom: 8 },
  successTitle: { fontSize: 18, fontWeight: "bold", color: "#1B5E20" },
  successSubtitle: { fontSize: 14, color: "#388E3C", marginTop: 4, textAlign: "center" },
  section: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "bold", color: "#333" },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusCancelled: { backgroundColor: "#FFEBEE" },
  statusText: { fontSize: 12, fontWeight: "600", color: "#1B5E20" },
  statusCancelledText: { color: "#C62828" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: "#888" },
  infoValue: { fontSize: 14, color: "#333", fontWeight: "500" },
  trackerStep: { flexDirection: "row", alignItems: "flex-start", minHeight: 44 },
  trackerLine: { alignItems: "center", width: 24, marginRight: 12 },
  trackerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#E0E0E0",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  trackerDotCompleted: { backgroundColor: "#1B5E20", borderColor: "#1B5E20" },
  trackerDotCurrent: { backgroundColor: "#fff", borderColor: "#1B5E20", borderWidth: 3 },
  trackerConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#E0E0E0",
    minHeight: 24,
  },
  trackerConnectorCompleted: { backgroundColor: "#1B5E20" },
  trackerLabel: { fontSize: 14, color: "#AAA", paddingTop: 0 },
  trackerLabelCompleted: { color: "#1B5E20" },
  trackerLabelCurrent: { color: "#1B5E20", fontWeight: "bold" },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: "#333", fontWeight: "500" },
  itemQty: { fontSize: 12, color: "#888", marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "600", color: "#333" },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 10 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: "#666" },
  totalValue: { fontSize: 14, color: "#333" },
  freeText: { fontSize: 14, color: "#1B5E20", fontWeight: "600" },
  grandTotal: { borderTopWidth: 1, borderTopColor: "#E0E0E0", marginTop: 8, paddingTop: 10 },
  grandTotalLabel: { fontSize: 16, fontWeight: "bold", color: "#333" },
  grandTotalValue: { fontSize: 18, fontWeight: "bold", color: "#1B5E20" },
  addressText: { fontSize: 14, color: "#555", lineHeight: 22 },
  notesText: { fontSize: 13, color: "#888", marginTop: 8, fontStyle: "italic" },
  backButton: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  backButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
